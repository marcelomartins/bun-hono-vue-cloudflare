import {
  PASSWORD_MAX_CODE_POINTS,
  PASSWORD_MIN_CODE_POINTS
} from "@bhvc/contracts/auth";

export const SECURITY = {
  passwordIterations: 100_000,
  passwordSaltBytes: 16,
  passwordHashBytes: 32,
  passwordMinCodePoints: PASSWORD_MIN_CODE_POINTS,
  passwordMaxCodePoints: PASSWORD_MAX_CODE_POINTS,
  sessionDays: 30,
  authBodyBytes: 16 * 1024,
  apiBodyBytes: 64 * 1024,
  outboundRequestTimeoutMs: 5_000
} as const;

export const SESSION_COOKIE = "__Host-bhvc-session";

const ENVIRONMENTS = ["local", "production"] as const;

type Environment = (typeof ENVIRONMENTS)[number];

const EMAIL_DRIVERS = ["none", "console", "ses"] as const;

type EmailDriver = (typeof EMAIL_DRIVERS)[number];

interface RuntimeSecrets {
  SESSION_SECRET: string;
  TURNSTILE_SECRET_KEY?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
}

export type AppEnv = Omit<Env, "ENVIRONMENT" | "EMAIL_DRIVER"> & RuntimeSecrets & {
  ENVIRONMENT: Environment;
  EMAIL_DRIVER: EmailDriver;
};

function isEnvironment(value: string): value is Environment {
  return (ENVIRONMENTS as readonly string[]).includes(value);
}

function isEmailDriver(value: string): value is EmailDriver {
  return (EMAIL_DRIVERS as readonly string[]).includes(value);
}

function isConfigured(value: string | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

export function isTurnstileEnabled(env: AppEnv): boolean {
  return isConfigured(env.TURNSTILE_SECRET_KEY);
}

export function assertRuntimeConfiguration(env: AppEnv): void {
  if (!isEnvironment(env.ENVIRONMENT)) {
    throw new Error(`ENVIRONMENT must be one of: ${ENVIRONMENTS.join(", ")}`);
  }
  if (new TextEncoder().encode(env.SESSION_SECRET ?? "").byteLength < 32) {
    throw new Error(
      "SESSION_SECRET must contain at least 32 UTF-8 bytes (set it in .dev.vars locally or with wrangler secret in production)"
    );
  }
  const origin = new URL(env.APP_ORIGIN);
  if (origin.origin !== env.APP_ORIGIN || origin.hostname !== env.APP_HOST) {
    throw new Error("APP_ORIGIN and APP_HOST must identify the same origin");
  }

  // Optional features validate their own configuration only when enabled, so the
  // starter runs with no email provider and no Turnstile account.
  if (!isEmailDriver(env.EMAIL_DRIVER)) {
    throw new Error(`EMAIL_DRIVER must be one of: ${EMAIL_DRIVERS.join(", ")}`);
  }
  if (env.EMAIL_DRIVER === "console" && env.ENVIRONMENT !== "local") {
    throw new Error("EMAIL_DRIVER=console prints message bodies and is only allowed when ENVIRONMENT=local");
  }
  if (env.EMAIL_DRIVER === "ses") {
    if (!isConfigured(env.SES_REGION) || !isConfigured(env.SES_FROM)) {
      throw new Error("EMAIL_DRIVER=ses requires SES_REGION and SES_FROM");
    }
    if (!isConfigured(env.AWS_ACCESS_KEY_ID) || !isConfigured(env.AWS_SECRET_ACCESS_KEY)) {
      throw new Error("EMAIL_DRIVER=ses requires AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
    }
  }
  if (isConfigured(env.TURNSTILE_SITE_KEY) !== isConfigured(env.TURNSTILE_SECRET_KEY)) {
    throw new Error("TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY must be configured together");
  }
}
