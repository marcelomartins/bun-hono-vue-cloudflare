import type { LoginRequest, RegisterRequest, SessionResponse } from '@bhvc/contracts'
import type { AppBindings } from '@api/env'
import { ApiError } from '@api/lib/errors'
import { SESSION_TTL_SECONDS, createSessionToken, hashPassword, hashSessionToken, verifyPassword } from '@api/lib/session'
import { createSession, deleteExpiredSessions, deleteSessionByTokenHash, findSessionByTokenHash } from './session-repository'
import { createUser, findUserByEmail, findUserById } from '@api/modules/user/user-repository'

const toSessionResponse = (user: { id: string; email: string; name: string }): SessionResponse => ({
  authenticated: true,
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
  },
})

const createLoginSession = async (env: AppBindings, user: { id: string; email: string; name: string }) => {
  const token = createSessionToken()

  const session = await createSession(env.DB, {
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash: await hashSessionToken(token),
    ttlSeconds: SESSION_TTL_SECONDS,
  })

  return {
    session,
    sessionToken: token,
    response: toSessionResponse(user),
  }
}

export const resolveSession = async (env: AppBindings, token: string) => {
  await deleteExpiredSessions(env.DB)

  const tokenHash = await hashSessionToken(token)
  const session = await findSessionByTokenHash(env.DB, tokenHash)

  if (!session) {
    return null
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await deleteSessionByTokenHash(env.DB, tokenHash)
    return null
  }

  const user = await findUserById(env.DB, session.userId)

  if (!user) {
    await deleteSessionByTokenHash(env.DB, tokenHash)
    return null
  }

  return { session, user }
}

export const getSessionState = async (env: AppBindings, token?: string | null): Promise<SessionResponse> => {
  if (!token) {
    return { authenticated: false, user: null }
  }

  const resolved = await resolveSession(env, token)

  if (!resolved) {
    return { authenticated: false, user: null }
  }

  return {
    authenticated: true,
    user: {
      id: resolved.user.id,
      email: resolved.user.email,
      name: resolved.user.name,
    },
  }
}

export const login = async (env: AppBindings, payload: LoginRequest) => {
  const user = await findUserByEmail(env.DB, payload.email)

  if (!user) {
    throw new ApiError(401, 'invalid_credentials', 'Invalid credentials.')
  }

  const validPassword = await verifyPassword(payload.password, user.passwordHash)

  if (!validPassword) {
    throw new ApiError(401, 'invalid_credentials', 'Invalid credentials.')
  }

  return createLoginSession(env, user)
}

export const register = async (env: AppBindings, payload: RegisterRequest) => {
  const existingUser = await findUserByEmail(env.DB, payload.email)

  if (existingUser) {
    throw new ApiError(409, 'email_already_in_use', 'Email is already in use.')
  }

  const user = await createUser(env.DB, {
    id: crypto.randomUUID(),
    name: payload.name,
    email: payload.email,
    passwordHash: await hashPassword(payload.password),
  })

  return createLoginSession(env, user)
}

export const logout = async (env: AppBindings, token?: string | null) => {
  if (token) {
    await deleteSessionByTokenHash(env.DB, await hashSessionToken(token))
  }
}
