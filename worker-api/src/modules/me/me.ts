import { Hono } from 'hono'
import type { AppEnv } from '@api/env'
import { jsonSuccess, setNoStore } from '@api/lib/response'
import { authRequired } from '@api/middlewares/auth-required'

export const meModule = new Hono<AppEnv>()

meModule.use('*', async (c, next) => {
  setNoStore(c)
  await next()
})

meModule.use('*', authRequired())

meModule.get('/', async (c) => {
  return jsonSuccess(c, c.get('currentUser'))
})
