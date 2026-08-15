import { nowIso } from "../shared/dates";
import { uuidV7 } from "../shared/uuid";

export interface UserRow {
  id: number;
  uuid: string;
  name: string;
  email: string;
  normalized_email: string;
  password_hash: string;
  session_version: number;
  version: number;
  created_at: string;
}

const USER_SELECT = `
  SELECT id, uuid, name, email, normalized_email, password_hash,
    session_version, version, created_at
  FROM users`;

export function findUserByEmail(database: D1Database, normalizedEmail: string): Promise<UserRow | null> {
  return database
    .prepare(`${USER_SELECT} WHERE normalized_email = ? LIMIT 1`)
    .bind(normalizedEmail)
    .first<UserRow>();
}

export function findUserByUuid(database: D1Database, uuid: string): Promise<UserRow | null> {
  return database
    .prepare(`${USER_SELECT} WHERE uuid = ? LIMIT 1`)
    .bind(uuid)
    .first<UserRow>();
}

export async function createUser(
  database: D1Database,
  input: { name: string; email: string; normalizedEmail: string; passwordHash: string }
): Promise<UserRow> {
  const uuid = uuidV7();
  const timestamp = nowIso();
  await database
    .prepare(
      `INSERT INTO users (
         uuid, name, email, normalized_email, password_hash,
         session_version, version, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)`
    )
    .bind(uuid, input.name, input.email, input.normalizedEmail, input.passwordHash, timestamp, timestamp)
    .run();
  const created = await findUserByUuid(database, uuid);
  if (created === null) throw new Error("created user not found");
  return created;
}

/** Invalidates every session token already issued for the user. */
export async function bumpSessionVersion(database: D1Database, user: UserRow): Promise<void> {
  await database
    .prepare(
      `UPDATE users SET session_version = session_version + 1, updated_at = ?
       WHERE id = ? AND session_version = ?`
    )
    .bind(nowIso(), user.id, user.session_version)
    .run();
}

export async function updateUserName(
  database: D1Database,
  user: UserRow,
  name: string
): Promise<UserRow> {
  await database
    .prepare(
      `UPDATE users SET name = ?, version = version + 1, updated_at = ?
       WHERE id = ? AND version = ?`
    )
    .bind(name, nowIso(), user.id, user.version)
    .run();
  const updated = await findUserByUuid(database, user.uuid);
  if (updated === null) throw new Error("updated user not found");
  return updated;
}

export async function updateUserPassword(
  database: D1Database,
  user: UserRow,
  passwordHash: string
): Promise<UserRow> {
  await database
    .prepare(
      `UPDATE users SET password_hash = ?,
         session_version = session_version + 1,
         version = version + 1, updated_at = ?
       WHERE id = ? AND version = ?`
    )
    .bind(passwordHash, nowIso(), user.id, user.version)
    .run();
  const updated = await findUserByUuid(database, user.uuid);
  if (updated === null) throw new Error("updated user not found");
  return updated;
}
