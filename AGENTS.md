# AGENTS

## Instructions

- Act as a Senior Full-Stack Software Engineer with experience in TypeScript, Bun, Hono, Cloudflare Workers, D1, Vue 3, and web application security.
- IMPORTANT: Critically evaluate all prompts, requirements, and proposed solutions. If anything is incomplete, incorrect, insecure, inconsistent with the existing architecture, unnecessarily complex, or otherwise open to improvement, you MUST raise the concern, clearly explain the issue, and propose the most appropriate alternative before implementing it.
- Only do what is explicitly requested. Do not create features that were not requested.
- Only add comments when they explain decisions, risks, or non-obvious invariants; comments that merely describe the code are not necessary.
- There should be no unnecessary or unused code, and no unused files.
- Do not create documentation files unless they are clearly requested.
- Do not use Git to commit changes. Git may only be used to view or inspect changes.

## Goal

This repository is the source for `BHVC - Bun Hono Vue Cloudflare Starter Kit`, a small, reusable full-stack template:

- `worker-api` running on Cloudflare Workers with Hono
- `web-vue` as the single Vue web client
- `worker-shared/contracts` with the route registry, Zod schemas, and API types shared by both
- Cloudflare D1 bound as `DB`
- public pages generated with SSG; protected SPA routes served only after Worker auth checks

It is a generic starter: keep every feature free of product-specific behavior.

## Architecture Invariants

- Keep `wrangler.jsonc` at the repository root and the Worker entrypoint at `worker-api/src/index.ts`.
- The route registry in `worker-shared/contracts/src/router/routes.ts` is the single source of truth for public, backend, and protected routes. The Worker, the Vue router, SSG generation, and the build guards must all derive from it; never duplicate route lists.
- Protected routes must be checked by the Worker before serving the SPA shell. Only public pages are pre-rendered. The private shell (`/index-spa*`) returns 404 to direct browser requests.
- The session cookie must preserve the `__Host-` prefix, `HttpOnly`, `Secure`, `Path=/`, and `SameSite=Lax`. Session tokens are stateless HMAC-signed claims validated against the `session_version` column on `users`.
- Revocation is deliberate and must not be weakened: logging out increments `session_version`, invalidating every token of that user on every device. Changing the password does the same and reissues a token for the current session only.
- Optional integrations (email delivery, Turnstile) must stay optional. They are disabled by default, `assertRuntimeConfiguration` validates their settings only when enabled, and no default flow may depend on them. Once enabled, they fail closed.
- Every mutation must validate the host and the `Origin` header in the Worker (`validateHostAndOrigin`). Frontend controls never replace authorization or validation in the Worker.
- Runtime configuration fails closed: `assertRuntimeConfiguration` must keep rejecting missing or inconsistent `ENVIRONMENT`, `SESSION_SECRET`, `APP_HOST`, and `APP_ORIGIN`. Absence of secrets must never enable permissive fallbacks.
- Use D1 prepared statements with `.bind()` for all external values. Never build SQL by concatenation.
- All D1 tables use numeric `INTEGER PRIMARY KEY` ids internally and a UUID v7 `uuid` column as the public identifier. Never accept numeric database ids from clients; numeric ids never cross the API boundary.
- Validate request bodies with the shared Zod schemas through `readJson`, which enforces size limits during read. Do not use `request.json()` directly on external input.
- API errors follow the shared contract `{ error: { code, requestId, details? } }` with stable English codes. User-facing messages live in the frontend i18n map.
- Do not log request/response bodies, passwords, tokens, cookies, codes, or raw email addresses. Use `structuredLog` with non-sensitive diagnostic fields and `sanitizedRequestPath`.
- Keep technical names, code, tests, logs, and documentation in English. Keep visible application text in Brazilian Portuguese.
- Use Bun for package management, scripts, and unit tests. Do not switch the package manager or generate another lockfile.
- Prefer Web and Workers APIs. Node.js compatibility is enabled, but Node-specific APIs require a concrete need.
- Do not add browser dependencies casually: `check-client-build` enforces the forbidden-dependency list and a 300 kB gzip JavaScript budget.
- Treat existing migrations as applied. Schema changes require a new additive migration, unless the user explicitly confirms the database can be recreated.
- Do not put secrets in `wrangler.jsonc`, code, or committed files. Local secrets belong to `.dev.vars`; production uses `wrangler secret`.
- Integration tests must declare every optional binding in `vitest.config.ts` so the suite never depends on the developer's `.dev.vars`.
- The Worker CSP in `http/middleware.ts` and the static CSP in `web-vue/static/_headers` cover different responses of the same site and must stay aligned.
- `scripts/init.ts` holds the identifiers it rewrites, so it must keep excluding itself from the walk. Update it whenever a new starter identifier is introduced.
- Do not add remote bindings, deploy, use remote D1, set secrets, or change DNS without explicit authorization.

## Verification

Before completing shared changes, run:

```text
bun run verify
```

Or the individual steps while iterating:

```text
bun run types
bun run lint
bun run typecheck
bun test
bun run test:integration
bun run build
bun run db:migrate:local
```

Also confirm that:

- only public pages are pre-rendered (the build guard checks this)
- protected routes still go through the Worker first (the route contract test checks `wrangler.jsonc`)
- the Worker still bundles with `DB` and `ASSETS`

Targeted tests are appropriate while iterating. All integration tests must use local workerd/Miniflare bindings. Do not start `bun run dev` or run browser tests unless the task explicitly requires runtime validation.
