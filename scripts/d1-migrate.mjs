import { spawnSync } from 'node:child_process'

const mode = process.argv[2]

if (!['local', 'remote'].includes(mode)) {
  console.error('Use: bun ./scripts/d1-migrate.mjs <local|remote>')
  process.exit(1)
}

const result = spawnSync(
  'bunx',
  ['wrangler', 'd1', 'migrations', 'apply', 'DB', `--${mode}`, '--config', './wrangler.jsonc'],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
