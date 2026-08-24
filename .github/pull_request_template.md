## What this changes

<!-- One or two sentences. Link the issue if there is one. -->

## Why

<!-- The problem this solves. Skip if the linked issue already covers it. -->

## Checklist

- [ ] `bun run verify` passes from a clean checkout, with no `.dev.vars`
- [ ] No invariant in [AGENTS.md](../blob/main/AGENTS.md) was weakened, or the change explains why one should change
- [ ] Only public pages are pre-rendered; protected routes still pass through the Worker first
- [ ] No new browser dependency, or the client JavaScript budget and forbidden-dependency list were updated deliberately
- [ ] Everything added is in English, with no hardcoded locale
- [ ] No request bodies, passwords, tokens, cookies, or raw email addresses are logged
- [ ] Schema changes ship as a new additive migration
- [ ] Documentation updated if behavior a user relies on changed
