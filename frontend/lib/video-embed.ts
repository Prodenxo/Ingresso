export type VideoPlayerKind = 'iframe' | 'video' | 'external'

export interface ResolvedVideoSource {
  kind: VideoPlayerKind
  src: string
  externalUrl: string
}

function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').split('/')[0]
      return id && id.length === 11 ? id : null
    }

    if (!parsed.hostname.includes('youtube.com')) {
      return null
    }

    if (parsed.pathname.startsWith('/embed/')) {
      const id = parsed.pathname.replace('/embed/', '').split('/')[0]
      return id && id.length === 11 ? id : null
    }

    if (parsed.pathname.startsWith('/shorts/')) {
      const id = parsed.pathname.replace('/shorts/', '').split('/')[0]
      return id && id.length === 11 ? id : null
    }

    const fromQuery = parsed.searchParams.get('v')
    return fromQuery && fromQuery.length === 11 ? fromQuery : null
  } catch {
    return null
  }
}

function extractVimeoId(url: string): string | null {
  try {
    const parsed = new URL(url)

    if (!parsed.hostname.includes('vimeo.com')) {
      return null
    }

    if (parsed.hostname.includes('player.vimeo.com')) {
      const id = parsed.pathname.replace('/video/', '').split('/')[0]
      return id && /^\d+$/.test(id) ? id : null
    }

    const segments = parsed.pathname.split('/').filter(Boolean)
    const id = segments[segments.length - 1]
    return id && /^\d+$/.test(id) ? id : null
  } catch {
    return null
  }
}

function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(url)
}

function isUploadedVideoPath(url: string): boolean {
  return /\/api\/uploads\/cursos\//i.test(url)
}

function appendEmbedParams(baseSrc: string, origin?: string): string {
  try {
    const parsed = new URL(baseSrc)
    parsed.searchParams.set('rel', '0')
    parsed.searchParams.set('modestbranding', '1')
    parsed.searchParams.set('playsinline', '1')

    if (origin) {
      parsed.searchParams.set('origin', origin)
    }

    return parsed.toString()
  } catch {
    return baseSrc
  }
}

export function resolveVideoSource(
  rawUrl: string,
  options?: { origin?: string },
): ResolvedVideoSource | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return null
  }

  if (isUploadedVideoPath(trimmed)) {
    return {
      kind: 'video',
      src: trimmed,
      externalUrl: trimmed,
    }
  }

  const youtubeId = extractYoutubeId(trimmed)
  if (youtubeId) {
    const baseSrc = `https://www.youtube.com/embed/${youtubeId}`
    return {
      kind: 'iframe',
      src: appendEmbedParams(baseSrc, options?.origin),
      externalUrl: trimmed,
    }
  }

  const vimeoId = extractVimeoId(trimmed)
  if (vimeoId) {
    return {
      kind: 'iframe',
      src: appendEmbedParams(
        `https://player.vimeo.com/video/${vimeoId}`,
        options?.origin,
      ),
      externalUrl: trimmed,
    }
  }

  if (isDirectVideoFile(trimmed)) {
    return {
      kind: 'video',
      src: trimmed,
      externalUrl: trimmed,
    }
  }

  try {
    const parsed = new URL(trimmed)

    if (
      parsed.hostname.includes('player.vimeo.com') ||
      parsed.pathname.startsWith('/embed/')
    ) {
      return {
        kind: 'iframe',
        src: trimmed,
        externalUrl: trimmed,
      }
    }
  } catch {
    return null
  }

  return {
    kind: 'external',
    src: trimmed,
    externalUrl: trimmed,
  }
}
