import { Hono } from 'hono'
import type { AppEnv } from '@/env'
import { jsonSuccess, setNoStore } from '@/lib/response'
import { authRequired } from '@/middlewares/auth-required'

export const meModule = new Hono<AppEnv>()

meModule.use('*', async (c, next) => {
  setNoStore(c)
  await next()
})

meModule.use('*', authRequired())

meModule.get('/', async (c) => {
  return jsonSuccess(c, c.get('currentUser'))
})
