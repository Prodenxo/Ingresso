const LOCAL_API_URL = 'http://127.0.0.1:3001/api'

function normalizeApiUrl(value: string): string {
  return value.trim().replace(/\/$/, '')
}

export function getApiProxyTarget(): string {
  const target =
    process.env.API_PROXY_TARGET?.trim() ||
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    LOCAL_API_URL

  return normalizeApiUrl(target)
}

export function getClientApiUrl(): string {
  if (process.env.USE_SAME_ORIGIN_API === 'false') {
    return getApiProxyTarget()
  }

  return '/api'
}
