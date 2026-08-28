import { BRAND_STORAGE_PREFIX } from '@/lib/brand'
import { parsePercentual } from '@/lib/preco-promocional'
import type { LinkIndicacaoPublico } from '@/types/links-indicacao'

const STORAGE_KEY = `${BRAND_STORAGE_PREFIX}:link-indicacao`

export const INGRESSOS_REDIRECT = '/ingressos'

export function buildParticipanteRegisterUrl(): string {
  return `/register?redirect=${encodeURIComponent(INGRESSOS_REDIRECT)}&participante=1`
}

export function buildParticipanteLoginUrl(): string {
  return `/login?redirect=${encodeURIComponent(INGRESSOS_REDIRECT)}`
}

export function saveLinkIndicacao(data: LinkIndicacaoPublico): void {
  if (typeof window === 'undefined') return

  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...data,
      slug: data.slug.trim().toLowerCase(),
    }),
  )
}

export function getLinkIndicacao(): LinkIndicacaoPublico | null {
  if (typeof window === 'undefined') return null

  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as LinkIndicacaoPublico
    if (parsed?.slug?.trim()) {
      return parsed
    }
  } catch {
    const legacySlug = raw.trim()
    if (legacySlug) {
      return {
        slug: legacySlug.toLowerCase(),
        nome: legacySlug,
        eventoId: '',
        eventoNome: '',
        empresaNome: '',
        loteId: null,
        loteNome: null,
        lotePreco: null,
        descontoPercentual: null,
        precoComDesconto: null,
      }
    }
  }

  return null
}

export function saveLinkIndicacaoSlug(slug: string): void {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) return

  const current = getLinkIndicacao()
  if (current?.slug === normalized) return

  saveLinkIndicacao({
    slug: normalized,
    nome: normalized,
    eventoId: '',
    eventoNome: '',
    empresaNome: '',
    loteId: null,
    loteNome: null,
    lotePreco: null,
    descontoPercentual: null,
    precoComDesconto: null,
  })
}

export function getLinkIndicacaoSlug(): string | null {
  return getLinkIndicacao()?.slug ?? null
}

export function clearLinkIndicacaoSlug(): void {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem(STORAGE_KEY)
}

export function buildLinkIndicacaoUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, '')}/r/${slug}`
}

export function calcPrecoComDescontoIndicacao(
  preco: number,
  descontoPercentual: number | string | null | undefined,
): number {
  const desconto = parsePercentual(descontoPercentual)

  if (desconto <= 0) {
    return preco
  }

  const fator = 1 - desconto / 100
  return Math.round(preco * fator * 100) / 100
}
