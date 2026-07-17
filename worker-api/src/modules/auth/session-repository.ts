import type { SessionRecord } from './auth-types'
import { execute, nowIso, plusSecondsIso, queryFirst } from '@api/lib/db'

type SessionRow = {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  created_at: string
}

const mapSession = (row: SessionRow): SessionRecord => ({
  id: row.id,
  userId: row.user_id,
  tokenHash: row.token_hash,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
})

export const createSession = async (
  db: D1Database,
  values: { id: string; userId: string; tokenHash: string; ttlSeconds: number },
) => {
  const createdAt = nowIso()
  const expiresAt = plusSecondsIso(values.ttlSeconds)

  await execute(
    db.prepare('INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').bind(
      values.id,
      values.userId,
      values.tokenHash,
      expiresAt,
      createdAt,
    ),
  )

  return {
    id: values.id,
    userId: values.userId,
    tokenHash: values.tokenHash,
    expiresAt,
    createdAt,
  } satisfies SessionRecord
}

export const findSessionByTokenHash = async (db: D1Database, tokenHash: string) => {
  const row = await queryFirst<SessionRow>(db.prepare('SELECT * FROM sessions WHERE token_hash = ?').bind(tokenHash))
  return row ? mapSession(row) : null
}

export const deleteSessionByTokenHash = async (db: D1Database, tokenHash: string) => {
  await execute(db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash))
}

export const deleteExpiredSessions = async (db: D1Database) => {
  await execute(db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(nowIso()))
}
