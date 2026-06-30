import { API_URL } from '@/lib/api-client'

export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null
  }

  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:')
  ) {
    return path
  }

  const apiOrigin = API_URL.replace(/\/api\/?$/, '')
  return `${apiOrigin}${path.startsWith('/') ? path : `/${path}`}`
}
