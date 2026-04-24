export type AuthUser = {
  id: string
  email: string
  name: string
}

export type SessionResponse = {
  authenticated: boolean
  user: AuthUser | null
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  name: string
  email: string
  password: string
}
