'use client'

import { Card } from '@heroui/react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import type { CheckInValidacao } from '@/types/check-in'

interface CheckInResultCardProps {
  result: CheckInValidacao
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function CheckInResultCard({ result }: CheckInResultCardProps) {
  if (result.resultado === 'VALIDO') {
    return (
      <Card className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="size-8 shrink-0 text-emerald-300" aria-hidden />
          <div>
            <p className="text-lg font-semibold text-emerald-100">Entrada liberada</p>
            <p className="mt-2 text-2xl font-medium text-white">
              {result.ingresso?.participanteNome}
            </p>
            <p className="mt-1 text-sm text-emerald-100/80">
              {result.ingresso?.loteNome}
            </p>
            <p className="mt-1 text-xs text-emerald-200/70">
              {result.ingresso?.participanteEmail}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (result.resultado === 'JA_UTILIZADO') {
    return (
      <Card className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-8 shrink-0 text-amber-300" aria-hidden />
          <div>
            <p className="text-lg font-semibold text-amber-100">
              Ingresso já utilizado
            </p>
            <p className="mt-2 text-xl font-medium text-white">
              {result.ingresso?.participanteNome}
            </p>
            {result.checkin ? (
              <p className="mt-2 text-sm text-amber-100/80">
                Check-in em {formatDateTime(result.checkin.realizadoEm)}
                {result.checkin.operadorNome
                  ? ` por ${result.checkin.operadorNome}`
                  : ''}
              </p>
            ) : null}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
      <div className="flex items-start gap-3">
        <XCircle className="size-8 shrink-0 text-red-300" aria-hidden />
        <div>
          <p className="text-lg font-semibold text-red-100">Ingresso inválido</p>
          <p className="mt-2 text-sm text-red-100/80">
            {result.motivo ?? 'Não foi possível validar este ingresso'}
          </p>
          {result.ingresso ? (
            <p className="mt-2 text-sm text-red-100/70">
              {result.ingresso.participanteNome} — {result.ingresso.eventoNome}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
