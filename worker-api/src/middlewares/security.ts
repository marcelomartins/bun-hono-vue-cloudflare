import type { MiddlewareHandler } from 'hono'

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
].join('; ')

export const security = (): MiddlewareHandler => {
  return async (c, next) => {
    c.header('content-security-policy', CONTENT_SECURITY_POLICY)
    c.header('x-content-type-options', 'nosniff')
    c.header('x-frame-options', 'DENY')
    c.header('referrer-policy', 'strict-origin-when-cross-origin')
    c.header('permissions-policy', 'camera=(), microphone=(), geolocation=()')
    await next()
  }
}
