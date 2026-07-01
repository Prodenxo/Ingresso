'use client'

import { Card, Chip } from '@heroui/react'
import { Building2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { AuthEmpresa } from '@/types/auth'

interface EmpresasVinculadasCardProps {
  empresas: AuthEmpresa[]
  showLinkIngressos?: boolean
}

export function EmpresasVinculadasCard({
  empresas,
  showLinkIngressos = true,
}: EmpresasVinculadasCardProps) {
  if (empresas.length === 0) {
    return null
  }

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
          <CheckCircle2 className="size-5" aria-hidden />
        </div>
        <div>
          <h3 className="font-medium text-white">Empresas vinculadas</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Você tem acesso aos eventos e ingressos destas organizações.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {empresas.map((empresa) => (
          <li
            key={empresa.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Building2 className="size-4 shrink-0 text-indigo-300" aria-hidden />
              <span className="truncate font-medium text-white">{empresa.nome}</span>
            </div>
            <Chip size="sm" variant="soft" color="success">
              Membro
            </Chip>
          </li>
        ))}
      </ul>

      {showLinkIngressos ? (
        <Link
          href="/ingressos"
          className="mt-4 inline-block text-sm text-indigo-300 hover:underline"
        >
          Ver ingressos disponíveis
        </Link>
      ) : null}
    </Card>
  )
}
