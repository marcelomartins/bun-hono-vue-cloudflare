# AGENTS

## Goal

This repository is the source for `BHVC - Bun Hono Vue Cloudflare Starter Kit`.

It should stay a small, reusable full-stack starter with:

- `worker-api` running on Cloudflare Workers with Hono
- `web-vue` as the single Vue web client
- Cloudflare D1 bound as `DB`
- public pages generated with SSG
- protected SPA routes served only after Worker auth checks
- shared TypeScript contracts in `worker-shared/contracts`

## Architecture Rules

- Use Bun for workspace scripts and package management.
- Keep `wrangler.jsonc` at the repository root.
- Keep the Worker entrypoint at `worker-api/src/index.ts`.
- Keep frontend assets output at `dist/web-vue`.
- Keep the frontend as one Vue app.
- Keep public pages under `web-vue/src/public-pages`.
- Keep protected pages under `web-vue/src/modules/<feature>/pages`.
- Keep shared contracts in `worker-shared/contracts`.

## Routing Rules

- Public routes are pre-rendered with SSG.
- Protected routes must be checked by the Worker before serving the SPA shell.
- Authentication routes live under `/auth/*`.
- Versioned API routes live under `/api/v1/*`.

Current routes:

- Public: `/`, `/pricing`, `/contact`
- Protected: `/dashboard`, `/account`, `/settings`

## Backend Rules

- Organize backend code by module inside `worker-api/src/modules`.
- Keep authentication as the source of truth for protected route access.
- Keep D1 access in repository files inside the relevant module when possible.
- Keep cross-cutting behavior in `middlewares/`, `lib/`, and `env.ts`.

Base endpoints:

- `GET /health`
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/logout`
- `GET /auth/session`
- `GET /api/v1/me`

## Frontend Rules

- Keep session state in `web-vue/src/modules/auth/auth.ts`.
- Keep the public and protected layouts separate.
- Keep the public route list centralized in `web-vue/src/main.ts` via `includedRoutes`.

## Validation

After changes, validate with:

- `bun install`
- `bun run build`

Also confirm that:

- only public pages are pre-rendered
- protected routes still go through the Worker first
- the Worker still bundles with `DB` and `ASSETS`
