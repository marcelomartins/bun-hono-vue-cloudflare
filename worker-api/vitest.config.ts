import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

process.env.WRANGLER_LOG_PATH = resolve("../.logs/wrangler-test.log");

// The root wrangler.jsonc points at the built frontend; integration tests only
// exercise backend routes, so an empty assets directory is enough.
mkdirSync(resolve("../dist/web-vue"), { recursive: true });

const { cloudflareTest, readD1Migrations } = await import(
  "@cloudflare/vitest-pool-workers"
);
const migrations = await readD1Migrations("./migrations");

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "../wrangler.jsonc" },
      miniflare: {
        bindings: {
          ENVIRONMENT: "local",
          APP_HOST: "localhost",
          APP_ORIGIN: "http://localhost",
          SESSION_SECRET: "test-session-secret-that-is-at-least-32-bytes",
          // Every optional feature is pinned off here so the suite ignores whatever
          // the developer happens to have in .dev.vars.
          EMAIL_DRIVER: "none",
          SES_REGION: "",
          SES_FROM: "",
          AWS_ACCESS_KEY_ID: "",
          AWS_SECRET_ACCESS_KEY: "",
          TURNSTILE_SITE_KEY: "",
          TURNSTILE_SECRET_KEY: ""
        }
      }
    })
  ],
  test: {
    include: ["test/**/*.integration.ts"],
    setupFiles: ["./test/setup.ts"],
    sequence: { concurrent: false },
    provide: { d1Migrations: migrations }
  }
});
