import type { MiddlewareHandler } from 'hono'
import { ApiError } from '@/lib/errors'

export const authRequired = (): MiddlewareHandler => {
  return async (c, next) => {
    if (!c.get('currentUser')) {
      throw new ApiError(401, 'unauthorized', 'Authentication required.')
    }

    await next()
  }
}
