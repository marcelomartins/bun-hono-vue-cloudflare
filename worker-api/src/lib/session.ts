const encoder = new TextEncoder()
const PASSWORD_HASH_VERSION = 'pbkdf2_sha256_v1'
const PASSWORD_ITERATIONS = 100_000
const PASSWORD_SALT_BYTES = 16
const SESSION_TOKEN_BYTES = 32
const SESSION_COOKIE_NAME = 'app_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

const isSupportedPasswordIterations = (iterations: number) => {
  return Number.isInteger(iterations) && iterations > 0 && iterations <= PASSWORD_ITERATIONS
}

const toUint8Array = (bytes: ArrayBuffer | Uint8Array) => {
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
}

const toHex = (bytes: ArrayBuffer | Uint8Array) => {
  return Array.from(toUint8Array(bytes))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

const fromHex = (hex: string) => {
  if (hex.length === 0 || hex.length % 2 !== 0 || /[^a-f0-9]/i.test(hex)) {
    return null
  }

  const bytes = new Uint8Array(hex.length / 2)

  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16)
  }

  return bytes
}

const importPasswordKey = (password: string) => {
  return crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
}

const derivePasswordHash = async (password: string, salt: Uint8Array, iterations: number) => {
  const key = await importPasswordKey(password)
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    key,
    256,
  )

  return new Uint8Array(bits)
}

const timingSafeEqual = (left: Uint8Array, right: Uint8Array) => {
  if (left.length !== right.length) {
    return false
  }

  let difference = 0

  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index]
  }

  return difference === 0
}

export const hashPassword = async (password: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(PASSWORD_SALT_BYTES))
  const hash = await derivePasswordHash(password, salt, PASSWORD_ITERATIONS)
  return [PASSWORD_HASH_VERSION, String(PASSWORD_ITERATIONS), toHex(salt), toHex(hash)].join('$')
}

export const verifyPassword = async (password: string, passwordHash: string) => {
  const [version, iterationsValue, saltHex, expectedHashHex] = passwordHash.split('$')
  const iterations = Number.parseInt(iterationsValue, 10)

  if (version !== PASSWORD_HASH_VERSION) {
    return false
  }

  if (!isSupportedPasswordIterations(iterations)) {
    return false
  }

  const salt = fromHex(saltHex)
  const expectedHash = fromHex(expectedHashHex)

  if (!salt || !expectedHash) {
    return false
  }

  const actualHash = await derivePasswordHash(password, salt, iterations)
  return timingSafeEqual(actualHash, expectedHash)
}

export const createSessionToken = () => {
  return toHex(crypto.getRandomValues(new Uint8Array(SESSION_TOKEN_BYTES)))
}

export const hashSessionToken = async (token: string) => {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(token)))
}

export const getSessionCookieOptions = (secure: boolean) => ({
  httpOnly: true,
  sameSite: 'Lax' as const,
  secure,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
})

export const getSessionCookieName = () => SESSION_COOKIE_NAME
