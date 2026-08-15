import { describe, expect, test } from "bun:test";

import type { AppEnv } from "../config";
import { createSessionToken, readSessionCookie, verifySessionToken } from "./session";

const env = {
  SESSION_SECRET: "test-session-secret-that-is-at-least-32-bytes"
} as AppEnv;

const otherEnv = {
  SESSION_SECRET: "another-session-secret-that-is-32-bytes!!"
} as AppEnv;

describe("session tokens", () => {
  test("round-trips valid claims", async () => {
    const token = await createSessionToken(env, "01890a5d-ac96-774b-bcce-b302099a8057", 1);
    const claims = await verifySessionToken(env, token);
    expect(claims).toMatchObject({ sub: "01890a5d-ac96-774b-bcce-b302099a8057", version: 1 });
  });

  test("rejects tokens signed with a different secret", async () => {
    const token = await createSessionToken(otherEnv, "01890a5d-ac96-774b-bcce-b302099a8057", 1);
    expect(await verifySessionToken(env, token)).toBeNull();
  });

  test("rejects tampered payloads", async () => {
    const token = await createSessionToken(env, "01890a5d-ac96-774b-bcce-b302099a8057", 1);
    const [payload = "", signature = ""] = token.split(".");
    const tampered = `${payload.slice(0, -2)}aa.${signature}`;
    expect(await verifySessionToken(env, tampered)).toBeNull();
    expect(await verifySessionToken(env, "not-a-token")).toBeNull();
  });

  test("rejects expired tokens", async () => {
    const past = Date.now() - 40 * 86_400_000;
    const token = await createSessionToken(env, "01890a5d-ac96-774b-bcce-b302099a8057", 1, past);
    expect(await verifySessionToken(env, token)).toBeNull();
  });

  test("reads the session cookie from a cookie header", () => {
    const request = new Request("https://app.example/", {
      headers: { cookie: "other=1; __Host-bhvc-session=abc.def; another=2" }
    });
    expect(readSessionCookie(request)).toBe("abc.def");
    expect(readSessionCookie(new Request("https://app.example/"))).toBeNull();
  });
});
