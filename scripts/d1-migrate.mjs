import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const mode = process.argv[2]

if (!['local', 'remote'].includes(mode)) {
  console.error('Use: bun ./scripts/d1-migrate.mjs <local|remote>')
  process.exit(1)
}

const args = ['wrangler', 'd1', 'migrations', 'apply', 'DB', `--${mode}`, '--config', './wrangler.jsonc']

if (mode === 'local') {
  args.push('--persist-to', fileURLToPath(new URL('../.wrangler/state', import.meta.url)))
}

const result = spawnSync(
  'bunx',
  args,
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
