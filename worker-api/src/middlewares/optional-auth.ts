import { getCookie } from 'hono/cookie'
import type { MiddlewareHandler } from 'hono'
import { getSessionCookieName } from '@api/lib/session'
import { resolveSession } from '@api/modules/auth/auth-service'

export const optionalAuth = (): MiddlewareHandler => {
  return async (c, next) => {
    const token = getCookie(c, getSessionCookieName())

    if (!token) {
      c.set('currentSession', null)
      c.set('currentUser', null)
      await next()
      return
    }

    const resolved = await resolveSession(c.env, token)
    c.set('currentSession', resolved?.session ?? null)
    c.set('currentUser', resolved?.user ?? null)
    await next()
  }
}
