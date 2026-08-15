import {
  BACKEND_ROUTE_PREFIXES,
  PRIVATE_SPA_SHELL_PATHS,
  PROTECTED_ROUTE_PREFIXES,
  PROTECTED_SPA_SHELL_ASSET_PATH,
  PUBLIC_SSG_ROUTES
} from "@bhvc/contracts/routes";
import { Hono } from "hono";
import type { Context } from "hono";

import { accountRoutes } from "./account/routes";
import { requireAuthentication, resolveAuthenticatedUser } from "./auth/middleware";
import { authRoutes } from "./auth/routes";
import { browserSecurityHeaders, errorResponse, requestPipeline } from "./http/middleware";
import type { AppBindings } from "./http/types";

const app = new Hono<AppBindings>();

function serveAsset(context: Context<AppBindings>, assetPath: string): Promise<Response> {
  const url = new URL(context.req.url);
  url.pathname = assetPath;
  url.search = "";
  return context.env.ASSETS.fetch(new Request(url, context.req.raw));
}

function publicAssetPath(path: string): string {
  return `${path.replace(/\/+$/u, "")}.html`;
}

function isPrivateShellPath(path: string): boolean {
  return (
    PRIVATE_SPA_SHELL_PATHS.some((candidate) => path === candidate) ||
    path.startsWith(`${PROTECTED_SPA_SHELL_ASSET_PATH}/`)
  );
}

function isBackendPath(path: string): boolean {
  return BACKEND_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function hasFileExtension(path: string): boolean {
  return /\/[^/]+\.[^/]+$/u.test(path);
}

async function serveProtectedShell(context: Context<AppBindings>): Promise<Response> {
  if (await resolveAuthenticatedUser(context) === null) {
    context.header("Cache-Control", "private, no-store");
    return context.redirect("/", 302);
  }
  return serveAsset(context, PROTECTED_SPA_SHELL_ASSET_PATH);
}

app.use("*", requestPipeline);
app.use("*", browserSecurityHeaders);

app.get("/health", async (context) => {
  const row = await context.env.DB
    .prepare("SELECT max(id) AS applied FROM d1_migrations")
    .first<{ applied: number | null }>();
  return context.json({
    status: "ok",
    service: "bhvc-starter-kit",
    migration: row?.applied ?? null
  });
});

app.route("/auth", authRoutes);

const api = new Hono<AppBindings>();
api.use("*", requireAuthentication);
api.route("/", accountRoutes);
app.route("/api/v1", api);

app.get("/", async (context) => {
  if (await resolveAuthenticatedUser(context)) {
    context.header("Cache-Control", "private, no-store");
    return context.redirect("/dashboard", 302);
  }
  return serveAsset(context, "/");
});

for (const route of PUBLIC_SSG_ROUTES) {
  if (route === "/") continue;
  app.get(route, (context) => serveAsset(context, publicAssetPath(route)));
}

for (const prefix of PROTECTED_ROUTE_PREFIXES) {
  app.get(prefix, serveProtectedShell);
  app.get(`${prefix}/*`, serveProtectedShell);
}

app.onError((error, context) => {
  if (!(error instanceof Error)) {
    return errorResponse(new Error("unknown error"), context.get("requestId"));
  }
  return errorResponse(error, context.get("requestId"));
});

app.notFound((context) => {
  const path = context.req.path;
  if (isPrivateShellPath(path) || isBackendPath(path)) return context.text("Not Found", 404);
  if (context.req.method === "GET" && !hasFileExtension(path)) {
    return serveAsset(context, publicAssetPath(path));
  }
  return context.env.ASSETS.fetch(context.req.raw);
});

export default app;
