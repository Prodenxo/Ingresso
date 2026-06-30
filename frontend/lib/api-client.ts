import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/lib/auth-storage'
import type { AuthSession, AuthUser } from '@/types/auth'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api'

interface ApiErrorBody {
  message?: string | string[]
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody
    const message = body.message

    if (Array.isArray(message)) {
      return message.join(', ')
    }

    if (message) {
      return message
    }
  } catch {
    // resposta não JSON
  }

  return 'Erro inesperado na requisição'
}

async function refreshSession(): Promise<AuthSession | null> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    return null
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    clearTokens()
    return null
  }

  const session = (await response.json()) as AuthSession
  setTokens(session.accessToken, session.refreshToken)
  return session
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers)
  const accessToken = getAccessToken()

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  }).catch(() => {
    throw new ApiError(
      'Servidor indisponível. Inicie o backend com npm run dev:api',
      0,
    )
  })

  if (response.status === 401 && retry) {
    const session = await refreshSession()

    if (session) {
      return apiFetch<T>(path, options, false)
    }
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function apiUpload<T>(
  path: string,
  formData: FormData | null,
  method: 'POST' | 'DELETE' = 'POST',
  retry = true,
): Promise<T> {
  const headers = new Headers()
  const accessToken = getAccessToken()

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: formData ?? undefined,
  }).catch(() => {
    throw new ApiError(
      'Servidor indisponível. Inicie o backend com npm run dev:api',
      0,
    )
  })

  if (response.status === 401 && retry) {
    const session = await refreshSession()

    if (session) {
      return apiUpload<T>(path, formData, method, false)
    }
  }

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status)
  }

  return (await response.json()) as T
}

export async function loginRequest(
  email: string,
  senha: string,
): Promise<AuthSession> {
  const session = await apiFetch<AuthSession>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    },
    false,
  )

  setTokens(session.accessToken, session.refreshToken)
  return session
}

export async function registerRequest(
  payload: Record<string, string>,
): Promise<AuthSession> {
  const session = await apiFetch<AuthSession>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    false,
  )

  setTokens(session.accessToken, session.refreshToken)
  return session
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me')
}

export function logoutRequest(): void {
  clearTokens()
}

export { API_URL }
