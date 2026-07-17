import {
  PRIVATE_SPA_SHELL_PATHS,
  PROTECTED_ROUTE_PREFIXES,
  PROTECTED_SPA_SHELL_ASSET_PATH,
} from '@bhvc/contracts'
import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AppEnv } from '@api/env'
import { withNoStore } from '@api/lib/response'
import { cors } from '@api/middlewares/cors'
import { csrfProtection } from '@api/middlewares/csrf-protection'
import { handleError } from '@api/middlewares/error-handler'
import { optionalAuth } from '@api/middlewares/optional-auth'
import { requestId } from '@api/middlewares/request-id'
import { security } from '@api/middlewares/security'
import { authModule } from '@api/modules/auth/auth'
import { healthModule } from '@api/modules/infra/health'
import { meModule } from '@api/modules/me/me'

const AUTH_PREFIX = '/auth'
const API_PREFIX = '/api'
const API_V1_PREFIX = '/api/v1'

const isProtectedSpaPath = (path: string) => {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

const isPrivateSpaShellPath = (path: string) => {
  return PRIVATE_SPA_SHELL_PATHS.some((shellPath) => path === shellPath)
    || path.startsWith(`${PROTECTED_SPA_SHELL_ASSET_PATH}/`)
}

const isBackendPath = (path: string) => {
  return path === '/health'
    || path.startsWith('/health/')
    || path === AUTH_PREFIX
    || path.startsWith(`${AUTH_PREFIX}/`)
    || path === API_PREFIX
    || path.startsWith(`${API_PREFIX}/`)
}

const hasFileExtension = (path: string) => /\/[^/]+\.[^/]+$/.test(path)

const toPublicHtmlAssetPath = (path: string) => {
  if (path === '/') {
    return '/index.html'
  }

  const normalizedPath = path.replace(/\/+$/, '')
  return `${normalizedPath}.html`
}

const serveAsset = (c: Context<AppEnv>, assetPath: string) => {
  const assetUrl = new URL(assetPath, c.req.url)
  return c.env.ASSETS.fetch(new Request(assetUrl, c.req.raw))
}

const serveProtectedSpaShell = async (c: Context<AppEnv>) => {
  if (!c.get('currentUser')) {
    return withNoStore(c.redirect('/'))
  }

  const response = withNoStore(await serveAsset(c, PROTECTED_SPA_SHELL_ASSET_PATH))
  return c.newResponse(response.body, response)
}

const app = new Hono<AppEnv>()

app.use('*', requestId())
app.use('*', security())
app.use('*', cors())
app.use('*', csrfProtection())
app.use('*', optionalAuth())

app.onError(handleError)

app.route('/health', healthModule)
app.route(AUTH_PREFIX, authModule)
app.route(`${API_V1_PREFIX}/me`, meModule)

for (const prefix of PROTECTED_ROUTE_PREFIXES) {
  app.get(prefix, serveProtectedSpaShell)
  app.get(`${prefix}/*`, serveProtectedSpaShell)
}

app.notFound(async (c) => {
  if (isPrivateSpaShellPath(c.req.path)) {
    return withNoStore(c.text('Not Found', 404))
  }

  if (isProtectedSpaPath(c.req.path)) {
    return c.req.method === 'GET'
      ? serveProtectedSpaShell(c)
      : withNoStore(c.text('Not Found', 404))
  }

  if (isBackendPath(c.req.path)) {
    return withNoStore(c.text('Not Found', 404))
  }

  if (!hasFileExtension(c.req.path)) {
    return serveAsset(c, toPublicHtmlAssetPath(c.req.path))
  }

  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
