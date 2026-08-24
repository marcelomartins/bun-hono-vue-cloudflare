# Contributing

Issues and pull requests are welcome. For significant changes, open an issue first so the design can be discussed before implementation.

## Before you open a pull request

Install and run the full pipeline. It has to pass from a clean checkout, with no `.dev.vars` — that is exactly what CI does.

```bash
bun install
```

```bash
bun run verify
```

`verify` runs type generation, lint (oxlint + knip), typecheck across every workspace, unit tests, integration tests against real workerd with migrated D1, the build with its guards, and local migrations. Fix the cause of a failure; never weaken a check to get past it.

## What must stay stable

The conventions the starter depends on are documented in [`AGENTS.md`](./AGENTS.md) under *Architecture Invariants*. They are deliberate, and a pull request that breaks one will be asked to change. In particular, preserve the routing model:

- only public pages are pre-rendered
- protected routes still pass through the Worker before the SPA shell is served
- the Worker still bundles with `DB` and `ASSETS`

Some other rules worth knowing before you start: everything is in English, including visible application text; no locale is hardcoded; all D1 access uses prepared statements with `.bind()`; request bodies are read through `readJson` with the shared Zod schemas; and nothing that could identify a user — bodies, passwords, tokens, cookies, raw email addresses — is ever logged.

## Reporting a security issue

Do not open a public issue. See [`SECURITY.md`](./SECURITY.md).
