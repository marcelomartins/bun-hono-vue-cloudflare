# AGENTS

## Instructions

- Act as a Senior Full-Stack Software Engineer with experience in TypeScript, Bun, Hono, Cloudflare Workers, D1, Vue 3, and web application security.
- IMPORTANT: Critically evaluate all prompts, requirements, and proposed solutions. If anything is incomplete, incorrect, insecure, inconsistent with the existing architecture, unnecessarily complex, or otherwise open to improvement, you MUST raise the concern, clearly explain the issue, and propose the most appropriate alternative before implementing it.
- Only do what is explicitly requested. Do not create features that were not requested.
- Only add comments when they explain decisions, risks, or non-obvious invariants; comments that merely describe the code are not necessary.
- There should be no unnecessary or unused code, and no unused files.
- Do not create documentation files unless they are clearly requested.
- Do not use Git to commit changes. Git may only be used to view or inspect changes.
- If `scripts/init.ts` still exists, this is either the starter itself or a project created from it that has not been initialized yet. Unless the user has said which, ask before changing anything; for a new project, follow [`SETUP.md`](./SETUP.md) before any other work.
- Read [`README.md`](./README.md) for the stack, the architecture, the routing model, and the API surface before changing code.

## Architecture Invariants

- Keep `wrangler.jsonc` at the repository root and the Worker entrypoint at `worker-api/src/index.ts`.
- Derive every routing decision from the route registry in `worker-shared/contracts/src/router/routes.ts`. Where a file cannot import it (`wrangler.jsonc`), keep a test that validates that file against the registry; never maintain an unchecked route list.
- Never pre-render a protected page, never serve the SPA shell before the Worker has checked the session, and keep `/index-spa*` returning 404 to direct browser requests.
- Keep the `__Host-` prefix, `HttpOnly`, `Secure`, `Path=/`, and `SameSite=Lax` on the session cookie.
- Sessions are stateless HMAC tokens bound to `users.session_version`, with no session table. This is a deliberate trade-off: a single device cannot be signed out on its own, and `SESSION_SECRET` can mint a session for any user, so a leaked secret must be rotated, which signs every user out. Changing this model is an explicit decision, not a refactor.
- Revocation must not be weakened: logout increments `session_version` and invalidates every token of that user on every device; a password change does the same and reissues a token for the current session only. Neither may report success unless its write happened.
- Security-sensitive account changes (the password today; email or session management if added) require the current password in the same request.
- Keep the optional integrations optional: disabled by default, validated by `assertRuntimeConfiguration` only when enabled, failing closed once enabled, and never required by a default flow.
- Validate the host and the `Origin` header in the Worker (`validateHostAndOrigin`) on every mutation. Frontend controls never replace authorization or validation in the Worker.
- Keep `assertRuntimeConfiguration` rejecting missing or inconsistent `ENVIRONMENT`, `SESSION_SECRET`, `APP_HOST`, and `APP_ORIGIN`. Absence of secrets must never enable permissive fallbacks.
- Use D1 prepared statements with `.bind()` for all external values. Never build SQL by concatenation.
- Writes that can lose a race must detect it: a conditional `UPDATE` or `DELETE` uses `RETURNING` or checks the affected rows, and an insert under a `UNIQUE` constraint uses `ON CONFLICT`. A lost race returns `409`, never a false success or a `500`.
- Never accept numeric database ids from clients; the UUID v7 `uuid` column is the only public identifier.
- Read external bodies through `readJson` with the shared Zod schemas, never `request.json()` directly.
- Keep API error codes stable and in English; user-facing messages belong in the frontend i18n map.
- Do not log request/response bodies, passwords, tokens, cookies, codes, or raw email addresses. Use `structuredLog` with non-sensitive diagnostic fields and `sanitizedRequestPath`.
- Keep everything in English: technical names, code, tests, logs, documentation, and visible application text. Never hardcode a locale.
- Use Bun for package management, scripts, and unit tests. Do not switch the package manager or generate another lockfile.
- Keep `bun audit` free of advisories. Every entry in the root `overrides` must be listed in [`CONTRIBUTING.md`](./CONTRIBUTING.md#dependencies) with why it exists and when to remove it.
- Prefer Web and Workers APIs. Node.js compatibility is enabled, but Node-specific APIs require a concrete need.
- Do not add browser dependencies casually: `check-client-build` enforces the forbidden-dependency list and the client JavaScript budget.
- Treat existing migrations as applied. Schema changes require a new additive migration, unless the user explicitly confirms the database can be recreated.
- Do not put secrets in `wrangler.jsonc`, code, or committed files.
- Declare every optional binding in `worker-api/vitest.config.ts` so integration tests never depend on the developer's `.dev.vars`.
- Define browser security headers only in `worker-shared/contracts/src/http/security-headers.ts`: the Worker applies them and the build generates `_headers` from them. Never hand-write `_headers`, `robots.txt`, or `sitemap.xml`; the build generates them.
- `scripts/init.ts` holds the identifiers it rewrites, so it must keep excluding itself from the walk. Update it whenever a new starter identifier is introduced.
- Do not add remote bindings, deploy, use remote D1, set secrets, or change DNS without explicit authorization.

## Verification

Run `bun run verify` before completing shared changes; the [Available Scripts](./README.md#available-scripts) table lists the individual steps to use while iterating. Also confirm the Worker still bundles with `DB` and `ASSETS`.

Targeted tests are appropriate while iterating. All integration tests must use local workerd/Miniflare bindings. Do not start `bun run dev` or run browser tests unless the task explicitly requires runtime validation.
