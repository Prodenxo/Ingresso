import { BRAND_STORAGE_PREFIX } from '@/lib/brand'

const STORAGE_KEY = `${BRAND_STORAGE_PREFIX}:link-indicacao`

export function saveLinkIndicacaoSlug(slug: string): void {
  if (typeof window === 'undefined') return

  sessionStorage.setItem(STORAGE_KEY, slug.trim().toLowerCase())
}

export function getLinkIndicacaoSlug(): string | null {
  if (typeof window === 'undefined') return null

  const value = sessionStorage.getItem(STORAGE_KEY)
  return value?.trim() || null
}

export function clearLinkIndicacaoSlug(): void {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem(STORAGE_KEY)
}

export function buildLinkIndicacaoUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, '')}/r/${slug}`
}
