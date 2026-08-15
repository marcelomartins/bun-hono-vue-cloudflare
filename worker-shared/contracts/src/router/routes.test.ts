import { describe, expect, test } from "bun:test";
import { parseConfigFileTextToJson } from "typescript";

import {
  BACKEND_ROUTE_PREFIXES,
  NOT_FOUND_SSG_ROUTE,
  PRIVATE_SPA_SHELL_PATHS,
  PROTECTED_ROUTE_PREFIXES,
  PUBLIC_SSG_ROUTES
} from "./routes";

describe("route registry", () => {
  test("keeps public, backend and protected routes disjoint", () => {
    const groups = [PUBLIC_SSG_ROUTES, BACKEND_ROUTE_PREFIXES, PROTECTED_ROUTE_PREFIXES];
    const all = groups.flat();
    expect(new Set(all).size).toBe(all.length);
    expect(all).not.toContain(NOT_FOUND_SSG_ROUTE);
    expect(PRIVATE_SPA_SHELL_PATHS).toContain("/index-spa.html");
  });

  test("matches Worker-first asset routes", async () => {
    // wrangler.jsonc keeps comments, so it needs a JSONC-aware parser.
    const source = await Bun.file("wrangler.jsonc").text();
    const parsed = parseConfigFileTextToJson("wrangler.jsonc", source);
    expect(parsed.error).toBeUndefined();
    const config = parsed.config as { assets: { run_worker_first: string[] } };
    for (const route of [...BACKEND_ROUTE_PREFIXES, ...PROTECTED_ROUTE_PREFIXES]) {
      expect(config.assets.run_worker_first).toContain(route);
      expect(config.assets.run_worker_first).toContain(`${route}/*`);
    }
    for (const shellPath of PRIVATE_SPA_SHELL_PATHS) {
      if (shellPath.endsWith("/")) continue;
      expect(config.assets.run_worker_first).toContain(shellPath);
    }
    expect(config.assets.run_worker_first).toContain("/");
    expect(config.assets.run_worker_first).toContain("!/assets/*");
  });
});
