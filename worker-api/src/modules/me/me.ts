import { Hono } from 'hono'
import type { AppEnv } from '@/env'
import { jsonSuccess } from '@/lib/response'
import { authRequired } from '@/middlewares/auth-required'

export const meModule = new Hono<AppEnv>()

meModule.use('*', authRequired())

meModule.get('/', async (c) => {
  return jsonSuccess(c, c.get('currentUser'))
})