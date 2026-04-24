import type { AuthUser } from '@bhvc/contracts'

export type UserRecord = AuthUser & {
  passwordHash: string
  createdAt: string
  updatedAt: string
}

export type SessionRecord = {
  id: string
  userId: string
  tokenHash: string
  expiresAt: string
  createdAt: string
}
