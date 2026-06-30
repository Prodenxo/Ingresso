import type { EventoDisponivel } from '@/types/ingressos'

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    VALIDO: 'Válido',
    UTILIZADO: 'Utilizado',
    CANCELADO: 'Cancelado',
    EXPIRADO: 'Expirado',
  }

  return labels[status] ?? status
}

export function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatEventDateBadge(value: string) {
  const date = new Date(value)

  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date
      .toLocaleDateString('pt-BR', { month: 'short' })
      .replace('.', '')
      .toUpperCase(),
    weekday: date
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', ''),
    time: date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

export function formatLocation(evento: EventoDisponivel): string | null {
  const parts = [evento.cidade, evento.estado].filter(Boolean)
  return parts.length > 0 ? parts.join(' - ') : null
}

export function getMenorPrecoLotes(
  lotes: EventoDisponivel['lotes'],
): number | null {
  if (lotes.length === 0) {
    return null
  }

  return Math.min(...lotes.map((lote) => lote.preco))
}

const NOME_LOTE_INTERNO =
  /^(valor\s*(fict[ií]cio|real|unit[aá]rio)|pre[cç]o\s*(âncora|ancora|de|riscado)|marketing|lote\s*\d*)$/i

export function getLoteNomeVitrine(
  nome: string,
  index: number,
  totalLotes: number,
): string | null {
  const trimmed = nome.trim()

  if (!trimmed || NOME_LOTE_INTERNO.test(trimmed)) {
    if (totalLotes > 1) {
      return `Ingresso ${index + 1}`
    }

    return null
  }

  return trimmed
}

export function buildCheckoutLoteLabel(
  eventoNome: string,
  loteNome: string,
  loteIndex: number,
  totalLotes: number,
): string {
  const nomeVitrine = getLoteNomeVitrine(loteNome, loteIndex, totalLotes)

  if (!nomeVitrine) {
    return eventoNome
  }

  return `${eventoNome} — ${nomeVitrine}`
}
