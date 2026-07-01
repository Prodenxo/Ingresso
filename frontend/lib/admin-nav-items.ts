import {
  BarChart3,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  QrCode,
  Settings,
  Ticket,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { AuthUser } from '@/types/auth'
import { canFazerCheckin, canGerenciarConviteMembros, canGerenciarCursos } from '@/lib/auth-roles'

export interface AdminNavItem {
  href: string
  label: string
  icon: LucideIcon
  requiresMembros?: boolean
  requiresCheckin?: boolean
  requiresCursos?: boolean
  mobilePrimary?: boolean
}

export const adminNavItems: AdminNavItem[] = [
  {
    href: '/dashboard',
    label: 'Início',
    icon: LayoutDashboard,
    mobilePrimary: true,
  },
  {
    href: '/eventos',
    label: 'Eventos',
    icon: CalendarDays,
    mobilePrimary: true,
  },
  {
    href: '/ingressos',
    label: 'Ingressos',
    icon: Ticket,
  },
  {
    href: '/check-in',
    label: 'Check-in',
    icon: QrCode,
    requiresCheckin: true,
    mobilePrimary: true,
  },
  {
    href: '/financeiro',
    label: 'Financeiro',
    icon: Wallet,
  },
  {
    href: '/relatorios',
    label: 'Relatórios',
    icon: BarChart3,
  },
  {
    href: '/membros',
    label: 'Membros',
    icon: Users,
    requiresMembros: true,
  },
  {
    href: '/cursos',
    label: 'Cursos',
    icon: GraduationCap,
    requiresCursos: true,
  },
  {
    href: '/configuracoes',
    label: 'Configurações',
    icon: Settings,
  },
]

export function getAdminNavItems(user: AuthUser | null): AdminNavItem[] {
  return adminNavItems.filter((item) => {
    if (item.requiresMembros && !canGerenciarConviteMembros(user)) {
      return false
    }

    if (item.requiresCheckin && !canFazerCheckin(user)) {
      return false
    }

    if (item.requiresCursos && !canGerenciarCursos(user)) {
      return false
    }

    return true
  })
}

export function getAdminMobilePrimaryNav(user: AuthUser | null): AdminNavItem[] {
  return getAdminNavItems(user).filter((item) => item.mobilePrimary)
}

export function getAdminMobileSecondaryNav(user: AuthUser | null): AdminNavItem[] {
  return getAdminNavItems(user).filter((item) => !item.mobilePrimary)
}
