import type { SessionRecord, UserRecord } from '@/modules/auth/auth-types'

export type AppBindings = {
  DB: D1Database
  ASSETS: Fetcher
  CORS_ALLOWED_ORIGINS?: string
}

export type AppVariables = {
  currentSession: SessionRecord | null
  currentUser: UserRecord | null
  requestId: string
}

export type AppEnv = {
  Bindings: AppBindings
  Variables: AppVariables
}
