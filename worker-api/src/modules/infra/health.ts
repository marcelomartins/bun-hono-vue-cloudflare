import { Hono } from 'hono'
import type { AppEnv } from '@/env'
import { jsonSuccess } from '@/lib/response'

export const healthModule = new Hono<AppEnv>()

healthModule.get('/', (c) => {
  return jsonSuccess(c, { status: 'ok' })
})
