import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Context } from 'hono'
import type { AppEnv } from '@/env'
import { getSessionCookieName, getSessionCookieOptions } from '@/lib/session'
import { jsonSuccess } from '@/lib/response'
import { loginSchema, registerSchema } from './auth-schema'
import { getSessionState, login, logout, register } from './auth-service'

const setAuthSessionCookie = (c: Context<AppEnv>, token: string) => {
  const secure = new URL(c.req.url).protocol === 'https:'
  setCookie(c, getSessionCookieName(), token, getSessionCookieOptions(secure))
}

export const authModule = new Hono<AppEnv>()

authModule.post('/login', async (c) => {
  const payload = loginSchema.parse(await c.req.json())
  const result = await login(c.env, payload)

  setAuthSessionCookie(c, result.sessionToken)

  return jsonSuccess(c, result.response)
})

authModule.post('/register', async (c) => {
  const payload = registerSchema.parse(await c.req.json())
  const result = await register(c.env, payload)

  setAuthSessionCookie(c, result.sessionToken)

  return jsonSuccess(c, result.response)
})

authModule.post('/logout', async (c) => {
  const token = getCookie(c, getSessionCookieName())
  await logout(c.env, token)
  deleteCookie(c, getSessionCookieName(), { path: '/' })
  return jsonSuccess(c, { ok: true })
})

authModule.get('/session', async (c) => {
  const token = getCookie(c, getSessionCookieName())
  return jsonSuccess(c, await getSessionState(c.env, token))
})
