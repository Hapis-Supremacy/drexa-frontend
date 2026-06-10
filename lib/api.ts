const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const opts: RequestInit = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers as Record<string, string> ?? {}) },
    ...init,
  }

  let res = await fetch(BASE + path, opts)

  if (res.status === 401) {
    const refreshed = await fetch(BASE + '/auth/refresh', { method: 'POST', credentials: 'include' })
    if (refreshed.ok) {
      res = await fetch(BASE + path, opts)
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
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
}
