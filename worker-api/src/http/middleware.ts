import type { ApiErrorBody } from "@bhvc/contracts/api";
import type { MiddlewareHandler } from "hono";

import { assertRuntimeConfiguration, isTurnstileEnabled } from "../config";
import { structuredLog } from "../observability/log";
import { sanitizedRequestPath } from "../observability/request-path";
import { uuidV7 } from "../shared/uuid";
import { AppError } from "./errors";
import type { AppBindings } from "./types";

let configurationChecked = false;

// Keep these directives aligned with web-vue/static/_headers, which covers the
// public pages served straight from the asset layer.
const TURNSTILE_HOST = "https://challenges.cloudflare.com";

function browserCsp(turnstileEnabled: boolean): string {
  const script = turnstileEnabled ? `'self' ${TURNSTILE_HOST}` : "'self'";
  const frame = turnstileEnabled ? `${TURNSTILE_HOST}` : "'none'";
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `frame-src ${frame}`,
    "img-src 'self' data:",
    "object-src 'none'",
    `script-src ${script}`,
    "style-src 'self' 'unsafe-inline'"
  ].join("; ");
}

const BROWSER_SECURITY_HEADERS = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
} as const;

const STRICT_TRANSPORT_SECURITY = "max-age=31536000; includeSubDomains";

function isSafeMethod(method: string): boolean {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

export function validateHostAndOrigin(request: Request, environment: AppBindings["Bindings"]): void {
  const url = new URL(request.url);
  const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  const origin = request.headers.get("origin");
  if (environment.ENVIRONMENT === "local") {
    if (!localHost) throw new AppError(400, "INVALID_HOST");
    if (!isSafeMethod(request.method) && origin !== url.origin) {
      throw new AppError(403, "INVALID_ORIGIN");
    }
    return;
  }
  if (url.hostname !== environment.APP_HOST) throw new AppError(400, "INVALID_HOST");
  if (!isSafeMethod(request.method) && origin !== environment.APP_ORIGIN) {
    throw new AppError(403, "INVALID_ORIGIN");
  }
}

export const requestPipeline: MiddlewareHandler<AppBindings> = async (context, next) => {
  const started = performance.now();
  const requestId = uuidV7();
  context.set("requestId", requestId);
  let status = 500;
  try {
    if (!configurationChecked) {
      assertRuntimeConfiguration(context.env);
      configurationChecked = true;
    }
    validateHostAndOrigin(context.req.raw, context.env);
    await next();
    status = context.res.status;
  } finally {
    if (context.error instanceof AppError) status = context.error.status;
    structuredLog(status >= 500 ? "error" : status >= 400 ? "warn" : "info", {
      event: "http_request",
      requestId,
      method: context.req.method,
      path: sanitizedRequestPath(context.req.raw),
      status,
      durationMs: Math.round(performance.now() - started)
    });
  }
};

export const browserSecurityHeaders: MiddlewareHandler<AppBindings> = async (context, next) => {
  await next();
  context.header("Content-Security-Policy", browserCsp(isTurnstileEnabled(context.env)));
  for (const [name, value] of Object.entries(BROWSER_SECURITY_HEADERS)) {
    context.header(name, value);
  }
  if (context.env.ENVIRONMENT !== "local") {
    context.header("Strict-Transport-Security", STRICT_TRANSPORT_SECURITY);
  }
  if (context.req.path.startsWith("/auth/") || context.req.path.startsWith("/api/")) {
    context.header("Cache-Control", "private, no-store");
  }
};

export function errorResponse(error: Error, requestId: string): Response {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let details: Record<string, string[]> | undefined;
  if (error instanceof AppError) {
    status = error.status;
    code = error.code;
    details = error.details;
  } else {
    structuredLog("error", {
      event: "unhandled_error",
      requestId,
      name: error.name,
      message: error.message
    });
  }
  const body: ApiErrorBody = {
    error: { code, requestId, ...(details === undefined ? {} : { details }) }
  };
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
