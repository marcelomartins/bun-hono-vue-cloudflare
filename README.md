# BHVC - Bun Hono Vue Cloudflare Starter Kit

A simple full-stack starter with Bun, Hono, Vue, Cloudflare Workers, and D1 Database.

## Stack

- Bun workspaces
- Vue 3 + Vue Router + Pinia + vite-ssg
- Hono on Cloudflare Workers
- Cloudflare D1 Database

## What you get

- Public pages rendered with SSG: `/`, `/pricing`, `/contact`
- Protected SPA routes served behind the Worker: `/dashboard`, `/account`, `/settings`
- Cookie-based authentication with `register`, `login`, `logout`, and `session`
- A working authenticated API example at `GET /api/v1/me`

## Prerequisites

- Bun
- A Cloudflare account

## Setup

1. Install dependencies.

```bash
bun install
```

2. Log in to Cloudflare.

```bash
bunx wrangler login
```

3. Create a D1 database.

```bash
bunx wrangler d1 create bhvc-starter-kit
```

4. Copy the returned `database_id` into `wrangler.jsonc`.

5. Run local migrations.

```bash
bun run d1:migrate:local
```

6. Build the frontend assets.

```bash
bun run build:web
```

7. Start the integrated local app.

```bash
bun run dev:api
```

8. Open the local Worker URL and register your first user from the home page.

## Development

- `bun run dev:api`: runs the full local app through the Worker
- `bun run dev:web`: runs the Vue app only
- `bun run build`: builds the frontend and dry-runs the Worker bundle

If you change frontend files while using `bun run dev:api`, run `bun run build:web` again so the Worker serves the updated assets.

## Deploy

1. Run remote migrations.

```bash
bun run d1:migrate:remote
```

2. Deploy the app.

```bash
bun run deploy
```
