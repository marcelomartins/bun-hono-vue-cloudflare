import type { MiddlewareHandler } from 'hono'
import { isAllowedOrigin } from '@/lib/origin'

export const cors = (): MiddlewareHandler => {
  return async (c, next) => {
    const origin = c.req.header('origin')
    const allowOrigin = origin ? isAllowedOrigin(c.env, c.req.url, origin) : false
    const requestedHeaders = c.req.header('access-control-request-headers')

    if (origin && allowOrigin) {
      c.header('access-control-allow-origin', origin)
      c.header('vary', 'origin')
      c.header('access-control-allow-credentials', 'true')
      c.header('access-control-allow-headers', requestedHeaders ?? 'content-type')
      c.header('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS')
    }

    if (c.req.method === 'OPTIONS') {
      if (origin && !allowOrigin) {
        return c.body(null, 403)
      }

      return c.body(null, 204)
    }

    await next()
  }
}
