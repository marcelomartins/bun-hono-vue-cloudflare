import type { AppBindings } from '@/env'

const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin
  }
  catch {
    return null
  }
}

const getConfiguredOrigins = (env: AppBindings) => {
  const configured = env.CORS_ALLOWED_ORIGINS?.split(',') ?? []

  return configured
    .map((value) => normalizeOrigin(value.trim()))
    .filter((value): value is string => Boolean(value))
}

export const getAllowedOrigins = (env: AppBindings, requestUrl: string) => {
  const allowedOrigins = new Set<string>()
  allowedOrigins.add(new URL(requestUrl).origin)

  for (const origin of getConfiguredOrigins(env)) {
    allowedOrigins.add(origin)
  }

  return allowedOrigins
}

export const isAllowedOrigin = (env: AppBindings, requestUrl: string, origin: string) => {
  const normalizedOrigin = normalizeOrigin(origin)

  if (!normalizedOrigin) {
    return false
  }

  return getAllowedOrigins(env, requestUrl).has(normalizedOrigin)
}

export const getOriginFromReferer = (referer?: string | null) => {
  if (!referer) {
    return null
  }

  return normalizeOrigin(referer)
}
