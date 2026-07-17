import { useAuthStore } from '../stores/auth'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
}

async function handleJsonResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T
  }

  const data: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const message = (data as { message?: string | string[] } | null)?.message
    const text = Array.isArray(message) ? message.join(', ') : (message ?? res.statusText)
    throw new ApiError(res.status, text)
  }

  return data as T
}

async function handleBlobResponse(res: Response): Promise<Blob> {
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null)
    const message = (data as { message?: string | string[] } | null)?.message
    const text = Array.isArray(message) ? message.join(', ') : (message ?? res.statusText)
    throw new ApiError(res.status, text)
  }
  return res.blob()
}

async function rawFetch<T>(path: string, options: RequestOptions, token: string | null): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  return handleJsonResponse<T>(res)
}

async function rawUpload<T>(path: string, formData: FormData, token: string | null): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  })
  return handleJsonResponse<T>(res)
}

async function rawDownload(path: string, token: string | null): Promise<Blob> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  return handleBlobResponse(res)
}

export function publicRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return rawFetch<T>(path, options, null)
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = useAuthStore()

  try {
    return await rawFetch<T>(path, options, auth.accessToken)
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && auth.refreshToken) {
      const refreshed = await auth.refresh()
      if (refreshed) {
        return rawFetch<T>(path, options, auth.accessToken)
      }
    }
    if (err instanceof ApiError && err.status === 401) {
      await auth.logout()
    }
    throw err
  }
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const auth = useAuthStore()

  try {
    return await rawUpload<T>(path, formData, auth.accessToken)
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && auth.refreshToken) {
      const refreshed = await auth.refresh()
      if (refreshed) {
        return rawUpload<T>(path, formData, auth.accessToken)
      }
    }
    if (err instanceof ApiError && err.status === 401) {
      await auth.logout()
    }
    throw err
  }
}

export async function apiDownload(path: string): Promise<Blob> {
  const auth = useAuthStore()

  try {
    return await rawDownload(path, auth.accessToken)
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && auth.refreshToken) {
      const refreshed = await auth.refresh()
      if (refreshed) {
        return rawDownload(path, auth.accessToken)
      }
    }
    if (err instanceof ApiError && err.status === 401) {
      await auth.logout()
    }
    throw err
  }
}
