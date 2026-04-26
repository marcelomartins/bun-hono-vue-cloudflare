import { Hono } from 'hono'
import type { AppEnv } from '@/env'
import { jsonSuccess, setNoStore } from '@/lib/response'

export const healthModule = new Hono<AppEnv>()

healthModule.get('/', (c) => {
  setNoStore(c)
  return jsonSuccess(c, { status: 'ok' })
})
