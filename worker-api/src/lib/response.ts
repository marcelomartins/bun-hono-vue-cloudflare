import type { Context } from 'hono'

const NO_STORE_HEADERS = {
  'cache-control': 'no-store, max-age=0',
  'expires': '0',
  'pragma': 'no-cache',
} as const

const applyNoStoreHeaders = (headers: Headers) => {
  for (const [name, value] of Object.entries(NO_STORE_HEADERS)) {
    headers.set(name, value)
  }
}

export const setNoStore = (c: Context) => {
  for (const [name, value] of Object.entries(NO_STORE_HEADERS)) {
    c.header(name, value)
  }
}

export const withNoStore = (response: Response) => {
  const headers = new Headers(response.headers)
  applyNoStoreHeaders(headers)

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}

export const jsonSuccess = <T>(c: Context, data: T, status = 200) => {
  return c.json({ success: true, data }, status)
}

export const jsonError = (c: Context, code: string, message: string, status = 400) => {
  return c.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    status,
  )
}
