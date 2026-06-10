const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1').replace(/\/+$/, '')

type ApiRequestInit = RequestInit & {
  retryOnUnauthorized?: boolean
}

function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`
}

async function request<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { retryOnUnauthorized = true, ...requestInit } = init
  const headers = new Headers(requestInit.headers)

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const opts: RequestInit = {
    ...requestInit,
    credentials: 'include',
    headers,
  }

  let res = await fetch(apiUrl(path), opts)

  if (retryOnUnauthorized && res.status === 401) {
    const refreshed = await fetch(apiUrl('/auth/refresh'), { method: 'POST', credentials: 'include' })
    if (refreshed.ok) {
      res = await fetch(apiUrl(path), opts)
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; message?: string }
    throw Object.assign(new Error(body?.error ?? body?.message ?? `HTTP ${res.status}`), { status: res.status })
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, init?: ApiRequestInit) => request<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: ApiRequestInit) =>
    request<T>(path, {
      ...init,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
}
