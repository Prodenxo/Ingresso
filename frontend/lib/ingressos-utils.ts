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

export function formatLocation(evento: EventoDisponivel): string | null {
  const parts = [evento.cidade, evento.estado].filter(Boolean)
  return parts.length > 0 ? parts.join(' - ') : null
}
