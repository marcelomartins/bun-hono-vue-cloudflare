export const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/account',
  '/settings',
] as const

export const PROTECTED_SPA_SHELL_ASSET_PATH = '/index-spa'

export const PRIVATE_SPA_SHELL_PATHS = [
  PROTECTED_SPA_SHELL_ASSET_PATH,
  `${PROTECTED_SPA_SHELL_ASSET_PATH}.html`,
] as const
