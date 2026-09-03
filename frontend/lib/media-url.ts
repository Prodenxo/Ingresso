import { getApiUrl } from '@/lib/public-env'

const UPLOAD_PATH_PATTERN = /\/api\/uploads\/(?:eventos|cursos)\/[^/?#]+/i
const ABSOLUTE_UPLOAD_PATTERN =
  /^https?:\/\/[^/?#]+\/(?:api\/uploads\/(?:eventos|cursos)\/[^/?#]+|eventos\/[^/?#]+)/i

function extractUploadPath(path: string): string | null {
  const match = path.match(UPLOAD_PATH_PATTERN)
  return match ? match[0] : null
}

function toSameOriginUploadPath(path: string): string {
  const uploadPath = extractUploadPath(path)

  if (uploadPath) {
    return uploadPath
  }

  return path.startsWith('/') ? path : `/${path}`
}

export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null
  }

  if (path.startsWith('blob:')) {
    return path
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (ABSOLUTE_UPLOAD_PATTERN.test(path)) {
      return path
    }

    const uploadPath = extractUploadPath(path)
    if (uploadPath) {
      return resolveMediaUrl(uploadPath)
    }

    return path
  }

  const normalizedPath = toSameOriginUploadPath(path)
  const apiUrl = getApiUrl()

  if (apiUrl.startsWith('/')) {
    return normalizedPath
  }

  if (normalizedPath.startsWith('/api/uploads/')) {
    const apiOrigin = apiUrl.replace(/\/api\/?$/, '')
    return `${apiOrigin}${normalizedPath}`
  }

  return normalizedPath
}
