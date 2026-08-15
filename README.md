# BHVC: Bun Hono Vue Cloudflare Starter Kit

An opinionated full-stack starter for building Cloudflare-native applications with Bun, Hono, Vue, and D1 Database.

BHVC combines pre-rendered public pages, authenticated SPA routes, a Worker-first request pipeline, shared TypeScript contracts, and a complete verification pipeline in a single repository. It is designed for teams that want one codebase for marketing pages, application pages, and API endpoints without giving up edge-native deployment.

## Contents

- [Why This Starter Exists](#why-this-starter-exists)
- [Tech Stack](#tech-stack)
- [Feature Guide](#feature-guide)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Repository Layout](#repository-layout)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Optional Features](#optional-features)
- [Development Workflow](#development-workflow)
- [Available Scripts](#available-scripts)
- [Routing Model](#routing-model)
- [API Surface](#api-surface)
- [Database](#database)
- [Testing and Verification](#testing-and-verification)
- [Continuous Integration](#continuous-integration)
- [Deployment](#deployment)
- [Running Outside Cloudflare](#running-outside-cloudflare)
- [Project Conventions](#project-conventions)
- [Support](#support)
- [Contributing](#contributing)
- [Project Status](#project-status)
- [License](#license)

## Why This Starter Exists

- Pre-render public pages for fast delivery and SEO-friendly HTML.
- Gate protected application routes through the Worker before the SPA shell is served.
- Keep one route registry as the single source of truth for every routing decision.
- Run backend logic on Cloudflare Workers with D1 Database as the default relational store.
- Share API contracts and validation schemas between frontend and backend through a workspace package.
- Ship with tests, linting, and build guards already wired, so new projects start at a high bar.

## Tech Stack

- Bun workspaces for package management, scripts, and unit tests
- Vue 3, Vue Router, vite-ssg, and @unhead/vue for the web client
- Hono on Cloudflare Workers for the API and route orchestration
- Cloudflare D1 Database for persistence
- Zod for shared validation schemas
- Vitest with `@cloudflare/vitest-pool-workers` for integration tests against real workerd
- oxlint and knip for linting and dead-code detection
- TypeScript (strict, shared root config) across all packages

## Feature Guide

### Routing and rendering

- Public pages generated with SSG: `/`, `/pricing`, `/contact`, `/login`, `/register`, plus a prerendered `404` page.
- Protected SPA routes served only after Worker-side auth: `/dashboard`, `/account`, `/settings`.
- A single route registry in [`worker-shared/contracts/src/router/routes.ts`](./worker-shared/contracts/src/router/routes.ts) drives the Worker, the Vue router, the SSG page list, and a contract test that validates `wrangler.jsonc` coverage.
- Authenticated visitors hitting `/` are redirected to `/dashboard` by the Worker.

### Authentication and security

- Cookie-based sessions with a `__Host-` prefixed, `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- Stateless session tokens signed with HMAC-SHA256 (`SESSION_SECRET`); no session table. A `session_version` column on `users` is the revocation mechanism: **logging out revokes every session of the user**, and changing the password revokes the sessions of all other devices while the current one receives a fresh token.
- Passwords hashed with PBKDF2-SHA256 (100k iterations, per-password salt, timing-safe compare, equalized work for unknown users).
- Host and Origin validation on every request replaces separate CORS/CSRF layers: the Worker only serves its configured host and rejects cross-origin mutations.
- Fail-closed runtime configuration: the Worker refuses to serve if `ENVIRONMENT`, `SESSION_SECRET`, `APP_HOST`, or `APP_ORIGIN` are missing or inconsistent.
- Request bodies are validated with shared Zod schemas and size-limited during read.
- Security headers (CSP, X-Frame-Options, Referrer-Policy, HSTS outside local) on Worker responses, plus a `_headers` file for statically served assets.

### API

- Versioned API under `/api/v1/*`, auth flows under `/auth/*`, health at `/health`.
- Machine-readable error contract: `{ "error": { "code", "requestId", "details?" } }`. The `requestId` also appears in the structured server log for correlation.
- Public identifiers are UUID v7; numeric database ids never cross the API boundary.
- Account endpoints for updating the profile name and changing the password, both bumping the row `version`.

### Optional integrations

Both are disabled by default and the starter runs with neither configured:

- **Email** through `EMAIL_DRIVER`: `none` (default), `console` (prints messages locally) or `ses` (Amazon SES via signed HTTPS, no SDK dependency).
- **Cloudflare Turnstile** on the login and registration forms, enabled by setting the site and secret keys.

### Frontend

- Typed API client (`apiFetch<T>`) with an `ApiError` carrying code, requestId, and field details; 401 responses redirect to `/login`.
- Error codes map to user-facing pt-BR messages in [`web-vue/src/i18n/pt-BR.ts`](./web-vue/src/i18n/pt-BR.ts).
- No client-side auth store: the Worker is the source of truth, and the SPA shell loads the current user from `/api/v1/me`.
- Per-page titles and descriptions via `@unhead/vue`.

### Build guards and observability

- `check-client-build.ts` runs after every frontend build and fails if: an SSG page is missing or not prerendered, the private SPA shell was prerendered, `_headers` is missing, source maps leak, a forbidden dependency (pinia, zod, axios, …) reaches the browser bundle, or client JavaScript exceeds 300 kB gzip.
- Structured JSON logs with request id, sanitized path (UUIDs masked), status, and duration; Workers observability enabled in `wrangler.jsonc`.

### Quality pipeline

- `bun run verify` runs everything: type generation, lint (oxlint + knip), typecheck (all workspaces), unit tests (bun:test), integration tests (workerd + D1 migrations), build with guards, and local migrations.

## Architecture at a Glance

```text
Browser request
	|
	+-> Public route (/pricing, /contact, /login, /register)
	|      -> Cloudflare asset layer resolves prerendered HTML without invoking the Worker
	|
	+-> Home (/)
	|      -> Worker redirects authenticated users to /dashboard, otherwise serves the SSG page
	|
	+-> Protected route (/dashboard, /account, /settings)
	|      -> Worker checks the session cookie first
	|      -> Worker fetches the canonical /index-spa asset
	|      -> Vue SPA loads protected modules
	|
	+-> Backend route (/auth/*, /api/v1/*, /health)
				 -> requestPipeline (config check, host/origin validation, request id, structured log)
				 -> Route modules with Zod-validated bodies
				 -> D1 Database access through repositories
```

The root [`wrangler.jsonc`](./wrangler.jsonc) scopes `run_worker_first` to `/`, backend namespaces, protected routes, and the private SPA shell. Public SSG pages and hashed assets are served directly by Cloudflare's asset layer.

## Repository Layout

```text
.
|- web-vue/                    # Vue application
|  |- src/public-pages/        # SSG public pages, layouts, and components
|  |- src/app/                 # Protected SPA layouts and pages
|  |- src/api/                 # Typed API client and error types
|  |- src/i18n/                # Error-code to pt-BR message map
|  |- src/router/              # Public and SPA route groups
|  |- scripts/                 # Post-build guards (check-client-build)
|  |- static/                  # _headers, favicon, robots.txt
|- worker-api/                 # Hono Worker
|  |- src/index.ts             # Entrypoint and request routing
|  |- src/config.ts            # SECURITY constants and fail-closed env validation
|  |- src/http/                # Middleware pipeline, error contract, JSON reader
|  |- src/auth/                # Registration, login, session middleware
|  |- src/account/             # /api/v1/me
|  |- src/security/            # Password hashing, session tokens, encodings
|  |- src/observability/       # Structured logs and path sanitization
|  |- migrations/              # D1 migrations
|  |- test/                    # Integration tests (vitest-pool-workers)
|- worker-shared/contracts/    # Shared package: route registry, Zod schemas, API types
|- wrangler.jsonc              # Root Cloudflare configuration
|- knip.json                   # Dead-code detection configuration
```

## Requirements

- [Bun](https://bun.sh/)
- [Node.js](https://nodejs.org/) 22.12 or newer for the Vite toolchain
- A Cloudflare account (only for deploying; local development is fully offline)

## Quick Start

### Starting a new project from this starter

Clone the repository, then rename every identifier with the bootstrap script:

```bash
bun run init --name minha-app --title "Minha App" --host app.minhaapp.com
```

It rewrites the package names, the Worker name, the D1 database name, the session cookie, the shared package scope, and the visible product name; creates `.dev.vars` with a freshly generated `SESSION_SECRET`; and prints the remaining manual steps. Preview everything first with `--dry-run`, and add `--create-d1` to also run `wrangler d1 create` and write the returned `database_id` into `wrangler.jsonc`.

| Flag | Purpose |
| --- | --- |
| `--name` | Required. Lowercase project identifier used for packages, Worker, and database |
| `--title` | Visible product name (defaults to a title-cased `--name`) |
| `--scope` | Workspace package scope (defaults to `@<name>`) |
| `--host` | Production hostname used for `APP_HOST`/`APP_ORIGIN` (defaults to `<name>.invalid`) |
| `--create-d1` | Create the D1 database and write its `database_id` |
| `--dry-run` | List the files that would change without writing anything |

Afterwards, review `README.md` and `AGENTS.md` (they still describe the starter) and delete `scripts/init.ts`.

### Running it

1. Install workspace dependencies.

```bash
bun install
```

2. Create your local environment file if the bootstrap script did not.

```bash
cp .dev.vars.example .dev.vars
```

Generate a value for `SESSION_SECRET` (at least 32 bytes):

```bash
bun --print "require('node:crypto').randomBytes(32).toString('base64url')"
```

3. Start the integrated local development server.

```bash
bun run dev
```

This applies local D1 migrations and starts Vue with HMR together with the Worker running in `workerd` on the same origin.

4. Open the local Vite URL and register the first user at `/register`.

## Optional Features

Both integrations are off by default. The runtime validates their configuration only when they are enabled, so an unconfigured starter still boots.

### Email

Set `EMAIL_DRIVER` in [`wrangler.jsonc`](./wrangler.jsonc) (production) or `.dev.vars` (local):

- `none`: no delivery. Calls are logged and skipped.
- `console`: prints the message in the terminal. Allowed only when `ENVIRONMENT=local`.
- `ses`: delivers through Amazon SES using SigV4-signed HTTPS requests, with no AWS SDK dependency. Requires `SES_REGION`, `SES_FROM`, and the `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets.

Messages live in [`worker-api/src/email/messages.ts`](./worker-api/src/email/messages.ts); registration sends a welcome message as a best-effort side effect, so a provider outage never fails a signup. Add new messages there and send them with `sendEmail`.

### Turnstile

1. Create a Turnstile widget in the Cloudflare dashboard.
2. Put the site key in `TURNSTILE_SITE_KEY` (a public var) and the secret with `bunx wrangler secret put TURNSTILE_SECRET_KEY`. Locally, both go in `.dev.vars`.
3. Uncomment the Turnstile directives in [`web-vue/static/_headers`](./web-vue/static/_headers), which carries the CSP for the statically served public pages. The Worker adjusts its own CSP automatically.

Once the secret is present, `/auth/register` and `/auth/login` require a valid token and fail closed on any verification error. The frontend widget reads the site key from `GET /auth/config`, so there is no second source of configuration in the build.

### Rate limiting (suggested, not included)

The starter ships no rate limiting, to avoid imposing storage on projects that may not need it. If you want it on `/auth/*`, the lightest option is Cloudflare's native Rate Limiting binding: it keeps no state of yours, so it costs no D1 writes and no extra tables.

Declare it in [`wrangler.jsonc`](./wrangler.jsonc):

```jsonc
"ratelimits": [
  { "name": "AUTH_LIMITER", "namespace_id": "1001", "simple": { "limit": 10, "period": 60 } }
]
```

Then reject in a middleware over the auth routes:

```ts
const { success } = await env.AUTH_LIMITER.limit({ key: request.headers.get("cf-connecting-ip") ?? "unknown" });
if (!success) throw new AppError(429, "RATE_LIMITED");
```

Two caveats worth knowing before relying on it: counters are per datacenter rather than global, and the binding is unavailable in local development, so guard it behind `ENVIRONMENT !== "local"`. For a stricter or fully global limit, use a Durable Object counter or a WAF rate limiting rule in the Cloudflare dashboard, which blocks before the Worker is even invoked.

## Development Workflow

- `bun run dev`: primary workflow. Applies local D1 migrations, runs Vue with HMR, and runs the Worker in `workerd` through the Cloudflare Vite plugin.
- `bun run dev:web`: runs only the Vue app for isolated frontend work; API and Worker-side route gates are not available.
- `bun run dev:api`: fallback for Worker debugging against the static frontend output in `dist/web-vue`. Run `bun run build:web` first and again after frontend changes.
- `bun run verify`: the full pipeline. Run it before sharing changes.

The integrated dev server uses one origin, keeps local binding state in the root `.wrangler/state`, and honors the same `run_worker_first` protected-route gate used in production. Public pages render client-side during development because their SSG files only exist after a production build; the dev-only assets fallback accounts for that difference.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `bun run init` | Rename the starter into a new project (see Quick Start) |
| `bun run dev` | Run the integrated Vue + Worker server with HMR and local D1 |
| `bun run dev:web` | Run the Vue app directly with Vite |
| `bun run dev:api` | Run the full application through Wrangler |
| `bun run build` | Build the frontend (with guards) and dry-run the Worker bundle |
| `bun run build:web` | Build the frontend into `dist/web-vue` and run `check-client-build` |
| `bun run typecheck` | Typecheck web-vue, worker-api, and contracts |
| `bun run lint` | Run oxlint and knip (dead code, unused dependencies) |
| `bun run test` | Run colocated unit tests with bun:test |
| `bun run test:integration` | Run integration tests in workerd with migrated D1 |
| `bun run test:all` | Unit plus integration tests |
| `bun run types` | Regenerate `worker-configuration.d.ts` from `wrangler.jsonc` |
| `bun run types:check` | Verify the generated types are current |
| `bun run worker:check` | Dry-run the Worker deployment |
| `bun run worker:startup` | Profile Worker startup time |
| `bun run db:migrate:local` | Apply D1 migrations locally |
| `bun run db:migrate:remote` | Apply D1 migrations remotely |
| `bun run verify` | Types, lint, typecheck, all tests, build, and local migrations |
| `bun run deploy` | Build and deploy the application |

## Routing Model

### The route registry

Every routing decision derives from [`worker-shared/contracts/src/router/routes.ts`](./worker-shared/contracts/src/router/routes.ts):

- `PUBLIC_SSG_ROUTES`: prerendered public pages. Consumed by `includedRoutes` in [`web-vue/src/main.ts`](./web-vue/src/main.ts), by the Worker's public asset handlers, and by `check-client-build`.
- `NOT_FOUND_SSG_ROUTE`: the prerendered `404` page used by Cloudflare's `not_found_handling`.
- `BACKEND_ROUTE_PREFIXES`: `/health`, `/auth`, `/api`. The Worker returns JSON 404s inside these namespaces instead of falling back to assets.
- `PROTECTED_ROUTE_PREFIXES`: routes gated by Worker auth before the SPA shell is served.
- `PROTECTED_SPA_SHELL_ASSET_PATH` and `PRIVATE_SPA_SHELL_PATHS`: the private shell, never served to direct browser requests.

The contract test [`routes.test.ts`](./worker-shared/contracts/src/router/routes.test.ts) keeps the groups disjoint and fails whenever `wrangler.jsonc` misses a `run_worker_first` pattern for a backend or protected route.

### Adding a public route

1. Create the page component under [`web-vue/src/public-pages`](./web-vue/src/public-pages) and call `usePublicHead` for its title.
2. Register the Vue route in [`web-vue/src/router/routes-public.ts`](./web-vue/src/router/routes-public.ts).
3. Add the path to `PUBLIC_SSG_ROUTES` in the route registry. SSG generation, the Worker handler, and the build guard all pick it up from there.
4. If the route should appear in the public header, add the link in [`SiteHeader.vue`](./web-vue/src/public-pages/components/SiteHeader.vue).

### Adding a protected route

1. Create the page component under `web-vue/src/app/pages`.
2. Register the Vue route in [`web-vue/src/router/routes-spa.ts`](./web-vue/src/router/routes-spa.ts).
3. Add the top-level prefix to `PROTECTED_ROUTE_PREFIXES` in the route registry.
4. Add the exact and wildcard patterns to `assets.run_worker_first` in [`wrangler.jsonc`](./wrangler.jsonc). `bun run test` fails when either pattern is missing.
5. If the route should appear in the authenticated navigation, add the link in [`SpaLayout.vue`](./web-vue/src/app/layouts/SpaLayout.vue).

Nested routes under an existing protected prefix (such as `/settings/profile`) only need the Vue route record; the shared prefix and the `/settings/*` pattern already cover them.

### Backend routes

- Auth routes live under `/auth/*`.
- Versioned API routes live under `/api/v1/*`; everything inside requires authentication by default.
- Health checks are available at `/health`.

## API Surface

Base endpoints:

- `GET /health` — service status and latest applied migration
- `GET /auth/config` — public auth configuration (Turnstile site key, or `null`)
- `POST /auth/register` — creates the user, sets the session cookie, returns the user DTO
- `POST /auth/login` — sets the session cookie
- `POST /auth/logout` — revokes every session of the user and clears the cookie
- `GET /api/v1/me` — current user DTO
- `PUT /api/v1/me` — updates the profile name
- `PUT /api/v1/me/password` — changes the password, revokes other sessions, reissues the current one

Errors always follow the shared contract:

```json
{ "error": { "code": "INVALID_CREDENTIALS", "requestId": "0198…", "details": { "email": ["invalid_format"] } } }
```

Request payloads are validated with the Zod schemas exported from `@bhvc/contracts/auth`, so frontend and backend cannot drift.

## Database

- Tables use numeric `INTEGER PRIMARY KEY` ids internally and a unique UUID v7 `uuid` column as the public identifier. Numeric ids never cross the API boundary.
- All D1 access uses prepared statements with `.bind()`.
- Migrations live in [`worker-api/migrations`](./worker-api/migrations) and are treated as applied: schema changes get a new additive migration.
- Integration tests apply the real migrations to an in-memory D1 before every run, so schema drift fails fast.

## Testing and Verification

- Unit tests use `bun:test` and live next to the module as `*.test.ts` (worker, contracts, and web).
- Integration tests live in [`worker-api/test`](./worker-api/test) and run through `@cloudflare/vitest-pool-workers`: real workerd runtime, real Hono app, real D1 with migrations applied.
- The route contract test validates `wrangler.jsonc` against the route registry.
- `check-client-build` guards the frontend build output.

Integration tests pin every optional feature off in their own bindings, so the suite ignores whatever sits in your local `.dev.vars` and stays reproducible.

Before sharing changes, run:

```bash
bun run verify
```

## Continuous Integration

[`.github/workflows/verify.yml`](./.github/workflows/verify.yml) runs `bun run verify` on every push to `main` and on every pull request. It deliberately does not create a `.dev.vars`, which keeps the pipeline honest: the repository must verify from a clean checkout, exactly as a new contributor experiences it.

## Deployment

1. Authenticate Wrangler and create the D1 database.

```bash
bunx wrangler login
```

```bash
bunx wrangler d1 create bhvc-starter-kit
```

2. Update [`wrangler.jsonc`](./wrangler.jsonc) with the returned `database_id`, and set `APP_HOST` and `APP_ORIGIN` to your production domain.

3. Set the session secret, plus the secrets of any optional feature you enabled (`TURNSTILE_SECRET_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).

```bash
bunx wrangler secret put SESSION_SECRET
```

4. Apply remote migrations and deploy.

```bash
bun run db:migrate:remote
```

```bash
bun run deploy
```

Keep the starter placeholder values in version control if you are publishing this repository as a reusable template. Local-only runtime configuration belongs in `.dev.vars`; production values belong in Wrangler secrets and `wrangler.jsonc` vars.

## Running Outside Cloudflare

The starter is Cloudflare-native by default, but it is not locked in. The HTTP layer is Hono, which runs on Bun, Node, and Deno unchanged, and the frontend build is plain static HTML with no platform coupling at all. This section describes the most direct alternative target: **a VPS or container running Bun with a local SQLite file**.

### What is actually coupled

Only three things in the backend depend on the platform:

| Coupling | Where | Replacement |
| --- | --- | --- |
| `env.DB` (D1) | all SQL lives in [`worker-api/src/auth/repository.ts`](./worker-api/src/auth/repository.ts), plus one health query | a D1-shaped adapter over `bun:sqlite` |
| `env.ASSETS` (Workers Assets) | 2 calls in [`worker-api/src/index.ts`](./worker-api/src/index.ts) | a static-file adapter over `dist/web-vue` |
| `cf-connecting-ip` header | 2 calls in [`worker-api/src/auth/routes.ts`](./worker-api/src/auth/routes.ts) | whatever header your reverse proxy sets, such as `x-forwarded-for` |

There is no KV, R2, Durable Object, `waitUntil`, `caches`, or `DB.batch()` usage anywhere, so no transaction semantics have to be reproduced. Sessions are stateless HMAC tokens, so no session store is needed either. The SQL is plain SQLite with `?` placeholders, so [`0001_init.sql`](./worker-api/migrations/0001_init.sql) runs unchanged on `bun:sqlite`, libSQL, or Turso. Moving to Postgres instead is a larger job: placeholders become `$1`, and `INTEGER PRIMARY KEY` becomes an identity column.

### 1. Replace the database type with a structural interface

Swap the `D1Database` type in the repository for an interface that describes only what the code uses. Both D1 and the adapter below satisfy it, so the repository functions stay untouched:

```ts
export interface Statement {
  bind(...values: unknown[]): Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface Database {
  prepare(sql: string): Statement;
}
```

### 2. Write the SQLite adapter

`bun:sqlite` is synchronous while D1 is promise-based, so the adapter must return promises to keep the same shape:

```ts
import { Database as Sqlite } from "bun:sqlite";
import type { Database, Statement } from "./database";

const sqlite = new Sqlite(process.env.DATABASE_PATH ?? "./data/app.sqlite", { create: true });
sqlite.exec("PRAGMA journal_mode = WAL");
sqlite.exec("PRAGMA foreign_keys = ON");

export const database: Database = {
  prepare(sql: string): Statement {
    const query = sqlite.query(sql);
    let values: unknown[] = [];
    const statement: Statement = {
      bind(...next) { values = next; return statement; },
      async first<T>() { return (query.get(...values) as T | null) ?? null; },
      async all<T>() { return { results: query.all(...values) as T[] }; },
      async run() { return query.run(...values); }
    };
    return statement;
  }
};
```

### 3. Write the assets adapter

This is the part that needs care, because it reproduces behavior Cloudflare was providing: extensionless URL resolution (`html_handling: auto-trailing-slash`), the `404.html` fallback (`not_found_handling`), and the caching headers that [`_headers`](./web-vue/static/_headers) declares. It must also reject path traversal, which the asset layer handled for you:

```ts
import { resolve, sep } from "node:path";

const ROOT = resolve("./dist/web-vue");

function insideRoot(candidate: string): boolean {
  const target = resolve(ROOT, `.${candidate}`);
  return target === ROOT || target.startsWith(ROOT + sep);
}

export const assets = {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (!insideRoot(pathname)) return new Response("Not Found", { status: 404 });

    // Same resolution order the Cloudflare asset layer applies.
    const candidates = pathname.endsWith("/")
      ? [`${pathname}index.html`]
      : [pathname, `${pathname}.html`, `${pathname}/index.html`];

    for (const candidate of candidates) {
      const file = Bun.file(resolve(ROOT, `.${candidate}`));
      if (await file.exists()) return new Response(file, { headers: staticHeaders(candidate) });
    }
    return new Response(Bun.file(resolve(ROOT, "404.html")), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" }
    });
  }
};
```

Write `staticHeaders` to mirror `_headers`: immutable caching for `/assets/*`, `must-revalidate` for HTML, plus the CSP and the other security headers.

### 4. Write the entry point

[`worker-api/src/index.ts`](./worker-api/src/index.ts) exports the Hono app directly, so serving it is a matter of building the `env` object it expects:

```ts
import app from "./worker-api/src/index";
import { assets } from "./platform/assets";
import { database } from "./platform/database";

const env = { ...process.env, DB: database, ASSETS: assets };

Bun.serve({ port: Number(process.env.PORT ?? 8080), fetch: (request) => app.fetch(request, env) });
```

The generated `worker-configuration.d.ts` disappears with Wrangler, so hand-write the `Env` interface that [`worker-api/src/config.ts`](./worker-api/src/config.ts) builds upon. Everything else in `config.ts`, including `assertRuntimeConfiguration`, keeps working: it only reads plain string values.

### 5. Replace the Wrangler-specific tooling

- **Migrations**: `wrangler d1 migrations apply` is gone. Use a migration runner (`dbmate`, `atlas`, or a short Bun script) and point the `/health` query at its bookkeeping table instead of `d1_migrations`.
- **Configuration**: `wrangler.jsonc` vars and `.dev.vars` become process environment variables. `EMAIL_DRIVER`, `APP_HOST`, `APP_ORIGIN`, `SESSION_SECRET`, and the optional secrets keep the same names and the same fail-closed validation.
- **Development**: `@cloudflare/vite-plugin` provided a single origin for Vue and the Worker. Without it, run Vite and the API as two processes and proxy `/auth`, `/api`, and `/health` from Vite with `server.proxy`.
- **Integration tests**: `@cloudflare/vitest-pool-workers` no longer applies, but the tests get simpler. Only [`test/helpers.ts`](./worker-api/test/helpers.ts) changes: `SELF.fetch(...)` becomes `app.fetch(new Request(...), testEnv)` against a temporary SQLite file, and the existing assertions keep working.
- **Route contract test**: [`routes.test.ts`](./worker-shared/contracts/src/router/routes.test.ts) validates `run_worker_first` in `wrangler.jsonc`. That concept does not exist here, so drop that test or repoint it at your reverse-proxy configuration.
- **Deployment**: build a container image that runs `bun run build:web` and the entry point above, and mount a volume for the SQLite file. TLS and process supervision become your responsibility.

### The constraints you are accepting

- **Public pages stop being free.** On Cloudflare, prerendered pages are served by the asset layer without ever invoking your code, from the edge. On a VPS every request reaches your process. Put Caddy, nginx, or a CDN in front to recover most of that.
- **`_headers` is ignored.** Those headers only exist if your server or reverse proxy sets them. Losing them silently means losing your CSP on public pages, so treat this as part of the port, not an afterthought.
- **One SQLite file means one node.** Horizontal scaling requires libSQL/Turso or Postgres. Backups, WAL checkpointing, and volume persistence become your responsibility, and a container without a mounted volume loses the database on every deploy.
- **Observability changes.** Structured logs still print, but to stdout; you need a log collector to get what the Workers dashboard gave you.
- **Deploys are yours.** No `wrangler deploy`, no automatic global distribution, no built-in rollback.

In exchange you lose the edge constraints: no per-request CPU limit (so a heavier password hash such as Argon2id becomes viable), no subrequest ceiling, long-lived connections and WebSockets without Durable Objects, and native Node libraries.

Two things that are **not** affected: Turnstile still works anywhere, since the widget is a hosted script and verification is an ordinary HTTPS request, and SES was never Cloudflare-specific.

## Project Conventions

If you plan to extend the starter, these conventions are intentional and should stay stable:

- Keep [`wrangler.jsonc`](./wrangler.jsonc) at the repository root and the Worker entrypoint at [`worker-api/src/index.ts`](./worker-api/src/index.ts).
- Keep the route registry in `worker-shared/contracts` as the single source of truth for routing.
- Keep public pages under `web-vue/src/public-pages` and protected pages under `web-vue/src/app/pages`.
- Keep auth routes under `/auth/*` and API routes under `/api/v1/*`.
- Keep technical names, code, tests, and logs in English; keep visible application text in Brazilian Portuguese.
- Never log request bodies, passwords, tokens, cookies, or raw email addresses.
- Secrets never live in `wrangler.jsonc` or in committed files.

## Support

Use GitHub Issues to report bugs, propose improvements, or ask implementation questions about the starter.

## Contributing

Issues and pull requests are welcome.

For significant changes, open an issue first so the design can be discussed before implementation. Before submitting a PR, make sure the full pipeline passes:

```bash
bun install
```

```bash
bun run verify
```

When contributing, preserve the routing model of the starter:

- only public pages should be pre-rendered
- protected routes should still pass through the Worker first
- the Worker should continue bundling with `DB` and `ASSETS`

## Project Status

BHVC is a reusable starter kit, not a finished product. Expect to clone it, adapt the modules, and replace the default authentication, pages, and data model with project-specific behavior.

## License

This repository is licensed under the MIT License. See [LICENSE](./LICENSE) for the full text.
