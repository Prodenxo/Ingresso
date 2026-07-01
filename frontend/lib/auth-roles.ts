import type { AuthUser, AuthEmpresa, TipoConta } from '@/types/auth'

export function isPainelAdmin(user: AuthUser | null): boolean {
  if (!user) {
    return false
  }

  return user.tipoConta === 'ORGANIZADOR' || user.tipoConta === 'SUPERADMIN'
}

export function canConfigurarPagamentos(user: AuthUser | null): boolean {
  if (!user) {
    return false
  }

  if (user.tipoConta === 'SUPERADMIN') {
    return true
  }

  return user.empresas.some(
    (empresa) =>
      empresa.papel === 'ADMINISTRADOR' || empresa.papel === 'FINANCEIRO',
  )
}

export function canGerenciarConviteMembros(user: AuthUser | null): boolean {
  if (!user) {
    return false
  }

  if (user.tipoConta === 'SUPERADMIN') {
    return true
  }

  return user.empresas.some((empresa) => empresa.papel === 'ADMINISTRADOR')
}

export function temVinculoEmpresa(user: AuthUser | null): boolean {
  return getEmpresasMembro(user).length > 0
}

export function getEmpresasMembro(user: AuthUser | null): AuthEmpresa[] {
  if (!user) {
    return []
  }

  return user.empresas.filter((empresa) => empresa.papel === 'MEMBRO')
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
