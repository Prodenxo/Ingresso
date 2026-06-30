import { getApiUrl } from '@/lib/public-env'

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

  const apiOrigin = getApiUrl().replace(/\/api\/?$/, '')
  return `${apiOrigin}${path.startsWith('/') ? path : `/${path}`}`
}
