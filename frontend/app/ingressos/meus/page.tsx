'use client'

import { Card, Chip } from '@heroui/react'
import { CalendarDays, PartyPopper, Ticket } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckInCelebrationModal } from '@/components/check-in/check-in-celebration-modal'
import { ParticipantShell } from '@/components/layout/participant-shell'
import { IngressoQrCode } from '@/components/check-in/ingresso-qr-code'
import { EmpresasVinculadasCard } from '@/components/membros/empresas-vinculadas-card'
import { useRequireParticipant } from '@/hooks/use-require-participant'
import { apiFetch } from '@/lib/api-client'
import { getEmpresasMembro, temVinculoEmpresa } from '@/lib/auth-roles'
import { formatEventDate, getLoteNomeVitrine, statusLabel } from '@/lib/ingressos-utils'
import { formatCurrency } from '@/lib/utils'
import type { MeuIngresso } from '@/types/ingressos'

interface CelebracaoCheckIn {
  participanteNome: string
  eventoNome: string
}

export default function MeusIngressosPage() {
  const { isReady, user } = useRequireParticipant()
  const [ingressos, setIngressos] = useState<MeuIngresso[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [celebracao, setCelebracao] = useState<CelebracaoCheckIn | null>(null)
  const statusAnteriorRef = useRef<Map<string, string>>(new Map())
  const celebracaoMostradaRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isReady) {
      return
    }

    let active = true

    function aplicarIngressos(data: MeuIngresso[], detectarTransicao: boolean) {
      for (const ingresso of data) {
        const statusAnterior = statusAnteriorRef.current.get(ingresso.id)

        if (
          detectarTransicao &&
          statusAnterior === 'VALIDO' &&
          ingresso.status === 'UTILIZADO' &&
          !celebracaoMostradaRef.current.has(ingresso.id)
        ) {
          celebracaoMostradaRef.current.add(ingresso.id)
          setCelebracao({
            participanteNome: ingresso.participanteNome,
            eventoNome: ingresso.evento.nome,
          })

          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([100, 50, 100])
          }
        }

        statusAnteriorRef.current.set(ingresso.id, ingresso.status)
      }

      setIngressos(data)
    }

    async function loadIngressos(detectarTransicao: boolean) {
      try {
        const data = await apiFetch<MeuIngresso[]>('/ingressos/me')
        if (active) {
          aplicarIngressos(data, detectarTransicao)
        }
      } catch {
        if (active) {
          setIngressos([])
        }
      } finally {
        if (active) {
          setIsFetching(false)
        }
      }
    }

    void loadIngressos(false)

    const interval = setInterval(() => {
      void loadIngressos(true)
    }, 4000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [isReady])

  if (!isReady) {
    return null
  }

  return (
    <ParticipantShell
      title="Meus ingressos"
      subtitle={
        temVinculoEmpresa(user)
          ? 'Ingressos das empresas vinculadas à sua conta'
          : 'Vincule-se a uma empresa para ver seus ingressos'
      }
    >
      {celebracao ? (
        <CheckInCelebrationModal
          participanteNome={celebracao.participanteNome}
          eventoNome={celebracao.eventoNome}
          onClose={() => setCelebracao(null)}
        />
      ) : null}
      {!temVinculoEmpresa(user) ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <Ticket className="size-5" aria-hidden />
          </div>
          <h3 className="text-lg font-medium text-white">Nenhum vínculo ainda</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Use o link ou código de convite da empresa para acessar seus ingressos.
          </p>
          <Link
            href="/ingressos/vincular"
            className="mt-4 inline-block text-sm text-indigo-300 hover:underline"
          >
            Vincular empresa
          </Link>
        </Card>
      ) : isFetching ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Carregando ingressos...</p>
        </Card>
      ) : ingressos.length === 0 ? (
        <div className="mx-auto max-w-lg space-y-4">
          <EmpresasVinculadasCard
            empresas={getEmpresasMembro(user)}
            showLinkIngressos={false}
          />
          <Card className="glass-panel rounded-2xl border-white/10 p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <Ticket className="size-5" aria-hidden />
          </div>
          <h3 className="text-lg font-medium text-white">Nenhum ingresso ainda</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Quando você comprar ingressos, eles aparecerão aqui.
          </p>
        </Card>
        </div>
      ) : (
        <div className="grid gap-4">
          {ingressos.map((ingresso) => {
            const nomeLote = getLoteNomeVitrine(ingresso.lote.nome, 0, 1)

            return (
            <Card
              key={ingresso.id}
              className="glass-panel rounded-2xl border-white/10 p-0"
            >
              <Card.Header className="flex flex-row items-start justify-between gap-4 px-5 pt-5">
                <div>
                  <Card.Title className="text-white">
                    {ingresso.evento.nome}
                  </Card.Title>
                  <Card.Description className="mt-1 flex items-center gap-2 text-zinc-400">
                    <CalendarDays className="size-4" aria-hidden />
                    {formatEventDate(ingresso.evento.dataInicio)}
                  </Card.Description>
                </div>
                <Chip size="sm" variant="soft" color="accent">
                  {statusLabel(ingresso.status)}
                </Chip>
              </Card.Header>
              <Card.Content className="space-y-3 px-5 pb-5 text-sm text-zinc-300">
                {nomeLote ? (
                  <p>
                    <span className="text-zinc-500">Lote:</span> {nomeLote}
                  </p>
                ) : null}
                <p>
                  <span className="text-zinc-500">Valor:</span>{' '}
                  {formatCurrency(Number(ingresso.lote.preco))}
                </p>
                <p>
                  <span className="text-zinc-500">Participante:</span>{' '}
                  {ingresso.participanteNome}
                </p>
                {ingresso.status === 'UTILIZADO' ? (
                  <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-center">
                    <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200">
                      <PartyPopper className="size-5" aria-hidden />
                    </div>
                    <p className="font-medium text-emerald-100">Entrada confirmada!</p>
                    <p className="mt-2 text-sm text-emerald-100/80">
                      Tenha um ótimo evento — aproveite cada momento!
                    </p>
                  </div>
                ) : ingresso.qrCodeUrl ? (
                  <div className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-4 text-center">
                    <IngressoQrCode codigo={ingresso.qrCodeUrl} size={180} />
                    <p className="mt-3 text-xs uppercase tracking-wide text-indigo-300/80">
                      Código do ingresso
                    </p>
                    <p className="mt-1 font-mono text-sm text-indigo-100">
                      {ingresso.qrCodeUrl}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Apresente este QR Code na entrada — a equipe vai escanear.
                    </p>
                  </div>
                ) : null}
              </Card.Content>
            </Card>
            )
          })}
        </div>
      )}
    </ParticipantShell>
  )
}
