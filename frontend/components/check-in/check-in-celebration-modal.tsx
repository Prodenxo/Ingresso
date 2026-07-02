'use client'

import { Button, Card } from '@heroui/react'
import { PartyPopper, X } from 'lucide-react'

interface CheckInCelebrationModalProps {
  participanteNome: string
  eventoNome: string
  variant?: 'entrada' | 'concluido'
  onClose: () => void
}

function getPrimeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome
}

export function CheckInCelebrationModal({
  participanteNome,
  eventoNome,
  variant = 'entrada',
  onClose,
}: CheckInCelebrationModalProps) {
  const isConcluido = variant === 'concluido'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-celebration-title"
    >
      <Card className="glass-panel relative w-full max-w-sm rounded-2xl border-emerald-500/30 p-6 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
          <PartyPopper className="size-7" aria-hidden />
        </div>

        <h2 id="checkin-celebration-title" className="text-xl font-semibold text-white">
          {isConcluido ? 'Evento concluído!' : 'Entrada confirmada!'}
        </h2>

        <p className="mt-3 text-base leading-relaxed text-zinc-200">
          Olá, {getPrimeiroNome(participanteNome)}!{' '}
          {isConcluido ? (
            <>
              Você completou todos os bips em{' '}
              <span className="font-medium text-white">{eventoNome}</span>.
            </>
          ) : (
            <>
              Seu check-in em{' '}
              <span className="font-medium text-white">{eventoNome}</span> foi realizado com
              sucesso.
            </>
          )}
        </p>

        <p className="mt-4 text-lg font-medium text-emerald-200">
          {isConcluido ? 'Obrigado pela participação!' : 'Tenha um ótimo evento!'}
        </p>

        <Button variant="primary" className="mt-6 w-full" onPress={onClose}>
          Obrigado!
        </Button>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-zinc-400 hover:bg-white/10"
          aria-label="Fechar"
        >
          <X className="size-4" />
        </button>
      </Card>
    </div>
  )
}
