import { spawnSync } from 'node:child_process'

const result = spawnSync('bun', ['run', 'build'], {
  cwd: new URL('../web-vue', import.meta.url),
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
