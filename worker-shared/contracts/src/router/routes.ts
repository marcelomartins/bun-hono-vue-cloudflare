export const PUBLIC_SSG_ROUTES = [
  "/",
  "/pricing",
  "/contact",
  "/login",
  "/register"
] as const;

export const NOT_FOUND_SSG_ROUTE = "/404";

export const BACKEND_ROUTE_PREFIXES = ["/health", "/auth", "/api"] as const;

export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/account",
  "/settings"
] as const;

export const PROTECTED_SPA_SHELL_ASSET_PATH = "/index-spa";

export const PRIVATE_SPA_SHELL_PATHS = [
  PROTECTED_SPA_SHELL_ASSET_PATH,
  `${PROTECTED_SPA_SHELL_ASSET_PATH}/`,
  `${PROTECTED_SPA_SHELL_ASSET_PATH}.html`
] as const;
