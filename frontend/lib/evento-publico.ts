import { BRAND_STORAGE_PREFIX } from '@/lib/brand'

const PENDING_CHECKOUT_KEY = `${BRAND_STORAGE_PREFIX}:evento-checkout-pending`

export function buildEventoPublicoUrl(origin: string, eventoId: string): string {
  return `${origin.replace(/\/$/, '')}/evento/${eventoId}`
}

export function buildEventoPublicoRegisterUrl(eventoId: string): string {
  return `/register?redirect=${encodeURIComponent(`/evento/${eventoId}`)}&participante=1`
}

export function buildEventoPublicoLoginUrl(eventoId: string): string {
  return `/login?redirect=${encodeURIComponent(`/evento/${eventoId}`)}`
}

export function savePendingEventoCheckout(
  eventoId: string,
  loteId: string,
): void {
  if (typeof window === 'undefined') return

  sessionStorage.setItem(
    PENDING_CHECKOUT_KEY,
    JSON.stringify({ eventoId, loteId }),
  )
}

export function consumePendingEventoCheckout(
  eventoId: string,
): string | null {
  if (typeof window === 'undefined') return null

  const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as { eventoId: string; loteId: string }
    if (parsed.eventoId === eventoId && parsed.loteId) {
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
      return parsed.loteId
    }
  } catch {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
  }

  return null
}
