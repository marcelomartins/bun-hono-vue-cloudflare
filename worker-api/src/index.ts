import { Hono } from 'hono'
import type { Context } from 'hono'
import type { AppEnv } from '@/env'
import { authModule } from '@/modules/auth/auth'
import { healthModule } from '@/modules/infra/health'
import { meModule } from '@/modules/me/me'
import { cors } from '@/middlewares/cors'
import { csrfProtection } from '@/middlewares/csrf-protection'
import { handleError } from '@/middlewares/error-handler'
import { optionalAuth } from '@/middlewares/optional-auth'
import { requestId } from '@/middlewares/request-id'
import { security } from '@/middlewares/security'
import { withNoStore } from '@/lib/response'

const AUTH_PREFIX = '/auth'
const API_V1_PREFIX = '/api/v1'
const PROTECTED_SPA_SHELL_PATH = '/index-spa.html'

const spaRoutes = ['/dashboard', '/account', '/settings'] as const

const isProtectedSpaPath = (path: string) => {
  return spaRoutes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

const isBackendPath = (path: string) => {
  return path === '/health'
    || path === AUTH_PREFIX
    || path.startsWith(`${AUTH_PREFIX}/`)
    || path === API_V1_PREFIX
    || path.startsWith(`${API_V1_PREFIX}/`)
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

  const response = await serveAsset(c, PROTECTED_SPA_SHELL_PATH)
  return withNoStore(response)
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

for (const prefix of spaRoutes) {
  app.get(prefix, serveProtectedSpaShell)
  app.get(`${prefix}/*`, serveProtectedSpaShell)
}

app.notFound(async (c) => {
  if (c.req.path === PROTECTED_SPA_SHELL_PATH) {
    return withNoStore(new Response('Not Found', { status: 404 }))
  }

  if (isProtectedSpaPath(c.req.path)) {
    return serveProtectedSpaShell(c)
  }

  if (isBackendPath(c.req.path)) {
    return withNoStore(new Response('Not Found', { status: 404 }))
  }

  if (!hasFileExtension(c.req.path)) {
    return serveAsset(c, toPublicHtmlAssetPath(c.req.path))
  }

  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
