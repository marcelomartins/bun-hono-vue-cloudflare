import type { Context } from 'hono'

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
