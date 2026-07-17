import type { AppEnv } from '@api/env'
import { ApiError } from '@api/lib/errors'
import { logger } from '@api/lib/logger'
import { jsonError } from '@api/lib/response'

export const handleError = (error: Error, c: { env: AppEnv['Bindings']; get: <K extends keyof AppEnv['Variables']>(key: K) => AppEnv['Variables'][K] }) => {
  if (error instanceof ApiError) {
    return jsonError(c as never, error.code, error.message, error.status)
  }

  logger.error('Unhandled error', {
    requestId: c.get('requestId'),
    message: error.message,
  })

  return jsonError(c as never, 'internal_error', 'Unexpected server error.', 500)
}
