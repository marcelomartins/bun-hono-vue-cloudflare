import { readFileSync } from "node:fs";
import ts from "typescript";

/** The production APP_ORIGIN from wrangler.jsonc, used for absolute public URLs. */
export function appOrigin(wranglerConfigPath: string): string {
  // wrangler.jsonc keeps comments, so it needs a JSONC-aware parser.
  const parsed = ts.parseConfigFileTextToJson(wranglerConfigPath, readFileSync(wranglerConfigPath, "utf8"));
  const origin: unknown = (parsed.config as { vars?: { APP_ORIGIN?: unknown } } | undefined)?.vars?.APP_ORIGIN;
  if (parsed.error !== undefined || typeof origin !== "string" || URL.parse(origin)?.origin !== origin) {
    throw new Error(`${wranglerConfigPath} must define vars.APP_ORIGIN as a bare origin`);
  }
  return origin;
}
