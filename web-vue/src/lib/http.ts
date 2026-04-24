import type { ApiResponse } from '@bhvc/contracts'

export const requestJson = async <T>(url: string, errorMessage: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? errorMessage : payload.error.message)
  }

  return payload.data
}
