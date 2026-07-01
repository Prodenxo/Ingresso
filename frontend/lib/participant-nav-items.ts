import {
  Building2,
  GraduationCap,
  Link2,
  ShoppingCart,
  Ticket,
  type LucideIcon,
} from 'lucide-react'
import type { AuthUser } from '@/types/auth'
import { getEmpresasMembro, temAcessoCursos } from '@/lib/auth-roles'

export interface ParticipantNavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  mobilePrimary?: boolean
}

export function getParticipantNavItems(user: AuthUser | null): ParticipantNavItem[] {
  const temVinculo = getEmpresasMembro(user).length > 0
  const mostrarCursos = temAcessoCursos(user)

  const items: ParticipantNavItem[] = [
    {
      href: '/ingressos',
      label: 'Eventos',
      icon: ShoppingCart,
      exact: true,
      mobilePrimary: true,
    },
    {
      href: '/ingressos/meus',
      label: 'Meus',
      icon: Ticket,
      mobilePrimary: true,
    },
  ]

  if (mostrarCursos) {
    items.push({
      href: '/ingressos/cursos',
      label: 'Cursos',
      icon: GraduationCap,
      mobilePrimary: true,
    })
  }

  items.push({
    href: '/ingressos/vincular',
    label: temVinculo ? 'Empresas' : 'Vincular',
    icon: temVinculo ? Building2 : Link2,
    exact: true,
    mobilePrimary: true,
  })

  return items
}

export function getEmpresasVinculadasLabel(user: AuthUser | null): string | null {
  const empresas = getEmpresasMembro(user)

  if (empresas.length === 0) {
    return null
  }

  return empresas.length === 1 ? empresas[0]!.nome : `${empresas.length} empresas`
}
