import type { MiddlewareHandler } from 'hono'
import { ApiError } from '@api/lib/errors'
import { getOriginFromReferer, isAllowedOrigin } from '@api/lib/origin'

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const csrfProtection = (): MiddlewareHandler => {
  return async (c, next) => {
    if (!STATE_CHANGING_METHODS.has(c.req.method.toUpperCase())) {
      await next()
      return
    }

    const origin = c.req.header('origin') ?? getOriginFromReferer(c.req.header('referer'))

    if (!origin) {
      throw new ApiError(403, 'csrf_origin_missing', 'Missing Origin or Referer header.')
    }

    if (!isAllowedOrigin(c.env, c.req.url, origin)) {
      throw new ApiError(403, 'csrf_origin_invalid', 'Cross-origin request blocked.')
    }

    await next()
  }
}
