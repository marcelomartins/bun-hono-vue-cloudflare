import type { UserRecord } from '@/modules/auth/auth-types'
import { execute, nowIso, queryFirst } from '@/lib/db'

type UserRow = {
  id: string
  email: string
  password_hash: string
  name: string
  created_at: string
  updated_at: string
}

const mapUser = (row: UserRow): UserRecord => ({
  id: row.id,
  email: row.email,
  name: row.name,
  passwordHash: row.password_hash,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const findUserByEmail = async (db: D1Database, email: string) => {
  const row = await queryFirst<UserRow>(db.prepare('SELECT * FROM users WHERE email = ?').bind(email))
  return row ? mapUser(row) : null
}

export const findUserById = async (db: D1Database, id: string) => {
  const row = await queryFirst<UserRow>(db.prepare('SELECT * FROM users WHERE id = ?').bind(id))
  return row ? mapUser(row) : null
}

export const createUser = async (
  db: D1Database,
  input: {
    id: string
    name: string
    email: string
    passwordHash: string
  },
) => {
  const timestamp = nowIso()

  await execute(
    db
      .prepare('INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(input.id, input.email, input.passwordHash, input.name, timestamp, timestamp),
  )

  return {
    id: input.id,
    email: input.email,
    name: input.name,
    passwordHash: input.passwordHash,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies UserRecord
}
