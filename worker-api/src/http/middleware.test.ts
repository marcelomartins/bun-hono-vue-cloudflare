import { describe, expect, test } from "bun:test";

import type { AppEnv } from "../config";
import { validateHostAndOrigin } from "./middleware";
import { AppError } from "./errors";

const localEnv = { ENVIRONMENT: "local" } as AppEnv;
const productionEnv = {
  ENVIRONMENT: "production",
  APP_HOST: "app.example",
  APP_ORIGIN: "https://app.example"
} as AppEnv;

function request(url: string, method = "GET", origin?: string): Request {
  return new Request(url, {
    method,
    ...(origin === undefined ? {} : { headers: { origin } })
  });
}

describe("validateHostAndOrigin", () => {
  test("local: accepts localhost and same-origin mutations", () => {
    validateHostAndOrigin(request("http://localhost:5173/"), localEnv);
    validateHostAndOrigin(
      request("http://localhost:5173/auth/login", "POST", "http://localhost:5173"),
      localEnv
    );
  });

  test("local: rejects other hosts and cross-origin mutations", () => {
    expect(() => validateHostAndOrigin(request("http://app.example/"), localEnv)).toThrow(AppError);
    expect(() =>
      validateHostAndOrigin(request("http://localhost/auth/login", "POST", "http://evil.example"), localEnv)
    ).toThrow(AppError);
    expect(() =>
      validateHostAndOrigin(request("http://localhost/auth/login", "POST"), localEnv)
    ).toThrow(AppError);
  });

  test("production: pins the configured host and origin", () => {
    validateHostAndOrigin(request("https://app.example/"), productionEnv);
    validateHostAndOrigin(
      request("https://app.example/auth/login", "POST", "https://app.example"),
      productionEnv
    );
    expect(() => validateHostAndOrigin(request("https://other.example/"), productionEnv)).toThrow(AppError);
    expect(() =>
      validateHostAndOrigin(request("https://app.example/auth/login", "POST", "https://other.example"), productionEnv)
    ).toThrow(AppError);
  });
});
