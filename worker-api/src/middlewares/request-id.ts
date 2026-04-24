import type { MiddlewareHandler } from 'hono'

export const requestId = (): MiddlewareHandler => {
  return async (c, next) => {
    const value = crypto.randomUUID()
    c.set('requestId', value)
    c.header('x-request-id', value)
    await next()
  }
}
