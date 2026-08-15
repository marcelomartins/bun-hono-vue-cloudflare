import type { AuthConfigDto } from "@bhvc/contracts/api";
import { loginSchema, registerSchema } from "@bhvc/contracts/auth";
import { Hono } from "hono";

import { SECURITY } from "../config";
import { forbidden } from "../http/errors";
import { readJson } from "../http/json";
import type { AppBindings } from "../http/types";
import { clearedSessionCookie, sessionCookie } from "../security/session";
import { verifyTurnstile } from "../security/turnstile";
import { requireAuthentication } from "./middleware";
import * as service from "./service";

export const authRoutes = new Hono<AppBindings>();

authRoutes.get("/config", (context) => {
  const body: AuthConfigDto = {
    turnstileSiteKey: context.env.TURNSTILE_SITE_KEY.trim() === "" ? null : context.env.TURNSTILE_SITE_KEY
  };
  return context.json(body);
});

authRoutes.post("/register", async (context) => {
  const input = await readJson(context, registerSchema, SECURITY.authBodyBytes);
  const requestId = context.get("requestId");
  const passed = await verifyTurnstile(
    context.env,
    input.turnstileToken,
    context.req.header("cf-connecting-ip") ?? null,
    "register",
    requestId
  );
  if (!passed) throw forbidden("TURNSTILE_FAILED");
  const result = await service.register(context.env, input, requestId);
  context.header("Set-Cookie", sessionCookie(result.token));
  return context.json(result.user, 201);
});

authRoutes.post("/login", async (context) => {
  const input = await readJson(context, loginSchema, SECURITY.authBodyBytes);
  const requestId = context.get("requestId");
  const passed = await verifyTurnstile(
    context.env,
    input.turnstileToken,
    context.req.header("cf-connecting-ip") ?? null,
    "login",
    requestId
  );
  if (!passed) throw forbidden("TURNSTILE_FAILED");
  const token = await service.login(context.env, input, requestId);
  context.header("Set-Cookie", sessionCookie(token));
  return context.body(null, 204);
});

authRoutes.post("/logout", requireAuthentication, async (context) => {
  await service.logout(context.env, context.get("authenticated").user, context.get("requestId"));
  context.header("Set-Cookie", clearedSessionCookie());
  return context.body(null, 204);
});
