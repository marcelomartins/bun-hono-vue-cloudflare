# BHVC: Bun Hono Vue Cloudflare Starter Kit

An opinionated full-stack starter for building Cloudflare-native applications with Bun, Hono, Vue, and D1 Database.

BHVC combines pre-rendered public pages, authenticated SPA routes, a Worker-first request pipeline, and shared TypeScript contracts in a single repository. It is designed for teams that want one codebase for marketing pages, application pages, and API endpoints without giving up edge-native deployment.

## Contents

- [Why This Starter Exists](#why-this-starter-exists)
- [Tech Stack](#tech-stack)
- [What You Get Out of the Box](#what-you-get-out-of-the-box)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Repository Layout](#repository-layout)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Available Scripts](#available-scripts)
- [Routing Model](#routing-model)
- [API Surface](#api-surface)
- [Deployment](#deployment)
- [Project Conventions](#project-conventions)
- [Support](#support)
- [Contributing](#contributing)
- [Project Status](#project-status)
- [License](#license)

## Why This Starter Exists

- Pre-render public pages for fast delivery and SEO-friendly HTML.
- Gate protected application routes through the Worker before the SPA shell is served.
- Keep the frontend as a single Vue app with separate public and authenticated flows.
- Run backend logic on Cloudflare Workers with D1 Database as the default relational store.
- Share API contracts between frontend and backend through a workspace package.

## Tech Stack

- Bun workspaces for package management and scripts
- Vue 3, Vue Router, Pinia, and vite-ssg for the web client
- Hono on Cloudflare Workers for the API and route orchestration
- Cloudflare D1 Database for persistence
- TypeScript across all packages

## What You Get Out of the Box

- Public pages generated with SSG: `/`, `/pricing`, `/contact`
- Protected SPA routes: `/dashboard`, `/account`, `/settings`
- Cookie-based authentication with register, login, logout, and session endpoints
- Versioned API routing under `/api/v1/*`
- Shared contracts in [`worker-shared/contracts`](./worker-shared/contracts)
- Frontend assets served by the Worker from `dist/web-vue`

## Architecture at a Glance

```text
Browser request
	|
	+-> Public route (/ , /pricing, /contact)
	|      -> Worker resolves prerendered HTML from ASSETS
	|
	+-> Protected route (/dashboard, /account, /settings)
	|      -> Worker checks auth first
	|      -> Worker serves /index-spa.html
	|      -> Vue SPA loads protected modules
	|
	+-> Backend route (/auth/*, /api/v1/*, /health)
				 -> Hono middleware stack
				 -> Route modules
				 -> D1 Database access through repositories
```

The root [`wrangler.jsonc`](./wrangler.jsonc) is configured with `run_worker_first: true`, which is what allows the Worker to stay in control of protected route delivery before static assets are served.

## Repository Layout

```text
.
|- web-vue/                  # Vue application for public pages and SPA modules
|  |- src/public-pages/      # SSG public pages and layouts
|  |- src/modules/           # Protected feature modules
|  |- src/main.ts            # Vite SSG entry and public route inclusion
|- worker-api/               # Hono Worker API
|  |- src/index.ts           # Worker entrypoint and request routing
|  |- src/modules/           # Auth, health, me, and other backend modules
|  |- migrations/            # D1 Database migrations
|- worker-shared/contracts/  # Shared TypeScript contracts package
|- scripts/                  # Build, migration, and deploy scripts
|- wrangler.jsonc            # Root Cloudflare configuration
```

## Requirements

- [Bun](https://bun.sh/)
- A Cloudflare account
- Access to create and deploy a Cloudflare Worker and D1 database

## Quick Start

1. Install workspace dependencies.

```bash
bun install
```

2. Authenticate Wrangler with Cloudflare.

```bash
bunx wrangler login
```

3. Create a D1 database.

```bash
bunx wrangler d1 create bhvc-starter-kit
```

4. Update [`wrangler.jsonc`](./wrangler.jsonc) with the returned `database_id`.

Keep the starter placeholder in version control if you are publishing this repository as a reusable template. Put local-only runtime configuration in `.dev.vars`, and use Cloudflare dashboard variables or Wrangler secrets for production values instead of committing environment-specific data.

5. Apply local migrations.

```bash
bun run d1:migrate:local
```

6. Build the frontend assets that the Worker serves.

```bash
bun run build:web
```

7. Start the application through the Worker.

```bash
bun run dev:api
```

8. Open the local Wrangler URL in your browser and register the first user from the public home page.

## Development Workflow

Use the workflow that matches the part of the stack you are editing.

- `bun run dev:api`: runs the integrated application through Cloudflare Wrangler and serves assets through the Worker.
- `bun run dev:web`: runs the Vue app directly with Vite for isolated frontend work.
- `bun run build:web`: rebuilds the frontend output consumed by the Worker.
- `bun run build`: builds the frontend and performs a dry-run Worker bundle.

Important: when you are using `bun run dev:api`, the Worker serves files from `dist/web-vue`. If you change frontend code, run `bun run build:web` again so the Worker serves the updated assets.

## Available Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev:web` | Run the Vue app directly with Vite |
| `bun run dev:api` | Run the full application through Wrangler |
| `bun run build:web` | Build the frontend into `dist/web-vue` |
| `bun run build:api` | Dry-run the Worker deployment into `dist/worker-api` |
| `bun run build` | Build both frontend and Worker |
| `bun run d1:migrate:local` | Apply D1 database migrations locally |
| `bun run d1:migrate:remote` | Apply D1 database migrations remotely |
| `bun run deploy` | Build and deploy the application |
| `bun run cf:typegen` | Regenerate Cloudflare binding types |

## Routing Model

### Public routes

These pages are pre-rendered with `vite-ssg` and explicitly included from [`web-vue/src/main.ts`](./web-vue/src/main.ts).

Current public routes:

- `/`
- `/pricing`
- `/contact`

When you add a new public route, update every required location below:

1. Create the page component under [`web-vue/src/public-pages`](./web-vue/src/public-pages).
2. Register the Vue route in [`web-vue/src/router/routes-public.ts`](./web-vue/src/router/routes-public.ts).
3. Add the final public path to `publicPaths` in [`web-vue/src/main.ts`](./web-vue/src/main.ts) so `vite-ssg` actually generates the HTML file.
4. If the route should appear in the public header navigation, add the link in [`web-vue/src/public-pages/components/SiteHeader.vue`](./web-vue/src/public-pages/components/SiteHeader.vue).

Notes:

- The Worker does not keep a separate allowlist for public routes. Public pages work because the prerendered HTML exists and the Worker fallback in [`worker-api/src/index.ts`](./worker-api/src/index.ts) serves that HTML asset.
- [`web-vue/src/router/index.ts`](./web-vue/src/router/index.ts) already merges public and protected route groups, so you normally do not edit that file when adding a route.
- If you add a nested public page such as `/about/team`, add that full path to `publicPaths`; otherwise the page will exist in Vue Router but will not be generated as static HTML.

### Protected routes

These routes are application pages that should only be served after Worker-side auth checks.

Current protected routes:

- `/dashboard`
- `/account`
- `/settings`

Protected routes resolve to the SPA shell and then hydrate the Vue application. The Worker remains the source of truth for access control before the shell is served.

When you add a new protected route, update every required location below:

1. Create the page component under `web-vue/src/modules/<feature>/pages`.
2. Register the Vue route in [`web-vue/src/router/routes-spa.ts`](./web-vue/src/router/routes-spa.ts) and keep `meta.requiresAuth: true` on the route.
3. Add the top-level protected prefix to `spaRoutes` in [`worker-api/src/index.ts`](./worker-api/src/index.ts) so the Worker serves `index-spa.html` for that path and its children.
4. If the route should appear in the authenticated side navigation, add the link in [`web-vue/src/layouts/SpaLayout.vue`](./web-vue/src/layouts/SpaLayout.vue).

Notes:

- The Vue auth guard in [`web-vue/src/main.ts`](./web-vue/src/main.ts) already checks `meta.requiresAuth`, so new protected routes should follow that convention instead of introducing a separate guard.
- [`web-vue/src/router/index.ts`](./web-vue/src/router/index.ts) already merges the route groups, so it usually does not need changes.
- If you add a nested route under an existing protected prefix, such as `/settings/profile`, Vue Router still needs the new route record, but the Worker prefix list may already cover it through `/settings/*`.
- If you add a new top-level protected prefix, keep [`web-vue/src/router/routes-spa.ts`](./web-vue/src/router/routes-spa.ts) and [`worker-api/src/index.ts`](./worker-api/src/index.ts) in sync. If these files diverge, the route may work in Vue development but fail when served through the Worker.

### Backend routes

- Auth routes live under `/auth/*`
- Versioned API routes live under `/api/v1/*`
- Health checks are available at `/health`

## API Surface

Current base endpoints:

- `GET /health`
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`
- `GET /auth/session`
- `GET /api/v1/me`

## Deployment

1. Apply remote database migrations.

```bash
bun run d1:migrate:remote
```

2. Deploy the application.

```bash
bun run deploy
```

The deploy script runs `bun run build` first and then executes `wrangler deploy` using the root [`wrangler.jsonc`](./wrangler.jsonc).

## Project Conventions

If you plan to extend the starter, these conventions are intentional and should stay stable:

- Keep [`wrangler.jsonc`](./wrangler.jsonc) at the repository root.
- Keep the Worker entrypoint at [`worker-api/src/index.ts`](./worker-api/src/index.ts).
- Keep public pages under [`web-vue/src/public-pages`](./web-vue/src/public-pages).
- Keep protected pages under `web-vue/src/modules/<feature>/pages`.
- Keep shared contracts in [`worker-shared/contracts`](./worker-shared/contracts).
- Keep auth routes under `/auth/*` and API routes under `/api/v1/*`.

## Support

Use GitHub Issues to report bugs, propose improvements, or ask implementation questions about the starter.

## Contributing

Issues and pull requests are welcome.

For significant changes, open an issue first so the design can be discussed before implementation. Before submitting a PR, make sure the workspace installs and builds cleanly:

```bash
bun install
bun run build
```

When contributing, preserve the routing model of the starter:

- only public pages should be pre-rendered
- protected routes should still pass through the Worker first
- the Worker should continue bundling with `DB` and `ASSETS`

## Project Status

BHVC is a reusable starter kit, not a finished product. Expect to clone it, adapt the modules, and replace the default authentication, pages, and data model with project-specific behavior.

## License

This repository is licensed under the MIT License. See [LICENSE](./LICENSE) for the full text.
