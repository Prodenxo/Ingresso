import type { AuthUser, TipoConta } from '@/types/auth'

export function isPainelAdmin(user: AuthUser | null): boolean {
  if (!user) {
    return false
  }

  return user.tipoConta === 'ORGANIZADOR' || user.tipoConta === 'SUPERADMIN'
}

export function isParticipante(user: AuthUser | null): boolean {
  return user?.tipoConta === 'PARTICIPANTE'
}

export function getTipoContaLabel(tipoConta: TipoConta): string {
  const labels: Record<TipoConta, string> = {
    PARTICIPANTE: 'Participante',
    ORGANIZADOR: 'Organizador',
    SUPERADMIN: 'Super Admin',
  }

  return labels[tipoConta]
}

export function getHomeRoute(user: AuthUser | null): string {
  return isPainelAdmin(user) ? '/dashboard' : '/ingressos'
}
