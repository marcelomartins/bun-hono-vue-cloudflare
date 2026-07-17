import { Hono } from 'hono'
import type { AppEnv } from '@api/env'
import { jsonSuccess, setNoStore } from '@api/lib/response'

export const healthModule = new Hono<AppEnv>()

healthModule.get('/', (c) => {
  setNoStore(c)
  return jsonSuccess(c, { status: 'ok' })
})
