import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  PRIVATE_SPA_SHELL_PATHS,
  PROTECTED_ROUTE_PREFIXES,
  PROTECTED_SPA_SHELL_ASSET_PATH,
} from '../worker-shared/contracts/src/routes'
import { flattenDiagnosticMessageText, parseConfigFileTextToJson } from 'typescript'

const wranglerPath = fileURLToPath(new URL('../wrangler.jsonc', import.meta.url))
const source = await readFile(wranglerPath, 'utf8')
const parsed = parseConfigFileTextToJson(wranglerPath, source)

if (parsed.error) {
  throw new Error(flattenDiagnosticMessageText(parsed.error.messageText, '\n'))
}

const workerFirst = parsed.config?.assets?.run_worker_first

if (!Array.isArray(workerFirst) || !workerFirst.every((value) => typeof value === 'string')) {
  throw new Error('assets.run_worker_first must be an array of route patterns.')
}

const requiredPatterns = new Set([
  '/api',
  '/api/*',
  '/auth',
  '/auth/*',
  '/health',
  '/health/*',
  ...PROTECTED_ROUTE_PREFIXES.flatMap((prefix) => [prefix, `${prefix}/*`]),
  ...PRIVATE_SPA_SHELL_PATHS,
  `${PROTECTED_SPA_SHELL_ASSET_PATH}/*`,
  '!/assets/*',
])

const missingPatterns = [...requiredPatterns].filter((pattern) => !workerFirst.includes(pattern))

if (missingPatterns.length > 0) {
  throw new Error(`assets.run_worker_first is missing: ${missingPatterns.join(', ')}`)
}

console.log(`Validated ${PROTECTED_ROUTE_PREFIXES.length} protected route prefixes in wrangler.jsonc.`)
