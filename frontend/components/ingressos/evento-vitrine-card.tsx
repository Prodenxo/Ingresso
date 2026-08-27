'use client'

import { Button, Card } from '@heroui/react'
import { CalendarDays, MapPin } from 'lucide-react'
import { EventoPoster } from '@/components/ingressos/evento-poster'
import { LotePrecoPromo } from '@/components/ingressos/lote-preco-promo'
import {
  formatEventDate,
  formatEventDateBadge,
  formatLocation,
  getLoteNomeVitrine,
} from '@/lib/ingressos-utils'
import { resolveMediaUrl } from '@/lib/media-url'
import type { EventoDisponivel, LoteDisponivel } from '@/types/ingressos'

interface EventoVitrineCardProps {
  evento: EventoDisponivel
  onComprar: (lote: LoteDisponivel) => void
}

function shouldHideLoteNome(loteNome: string, eventoNome: string): boolean {
  const lote = loteNome.trim().toLowerCase()
  const evento = eventoNome.trim().toLowerCase()

  if (!lote) return true
  if (lote === evento) return true

  return false
}

export function EventoVitrineCard({ evento, onComprar }: EventoVitrineCardProps) {
  const location = formatLocation(evento)
  const dateBadge = formatEventDateBadge(evento.dataInicio)
  const totalLotes = evento.lotes.length
  const capaUrl = resolveMediaUrl(evento.bannerUrl ?? evento.imagemUrl)

  return (
    <Card className="glass-panel overflow-hidden rounded-2xl border-white/10 p-0">
      {capaUrl ? (
        <div className="relative h-40 w-full overflow-hidden border-b border-white/8 sm:h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capaUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/60 to-transparent" />
        </div>
      ) : null}

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex gap-4">
          {!capaUrl ? (
            <EventoPoster
              imagemUrl={evento.imagemUrl}
              bannerUrl={evento.bannerUrl}
              nome={evento.nome}
              size="md"
            />
          ) : null}

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/90">
              {evento.empresa.nome}
            </p>
            <h3 className="mt-1 text-2xl font-bold leading-tight text-white">
              {evento.nome}
            </h3>
          </div>
        </div>

        {evento.descricao ? (
          <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
            {evento.descricao}
          </p>
        ) : (
          <p className="text-sm italic text-zinc-500">
            Confira os ingressos disponíveis abaixo.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <CalendarDays className="size-4 text-indigo-300" aria-hidden />
            <div className="text-sm">
              <p className="font-medium capitalize text-white">
                {dateBadge.weekday}, {dateBadge.day} {dateBadge.month}
              </p>
              <p className="text-zinc-400">{dateBadge.time}</p>
            </div>
          </div>

          {location ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
              <MapPin className="size-4 shrink-0 text-indigo-300" aria-hidden />
              {location}
            </span>
          ) : null}
        </div>

        {evento.endereco ? (
          <p className="text-xs text-zinc-500">{evento.endereco}</p>
        ) : null}
      </div>

      <div className="border-t border-white/8 bg-black/25 px-4 py-4 sm:px-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Escolha seu ingresso
        </p>
        <div className="space-y-2">
          {evento.lotes.map((lote, index) => {
            const nomeVitrine = getLoteNomeVitrine(lote.nome, index, totalLotes)
            const hideLoteNome = shouldHideLoteNome(lote.nome, evento.nome)
            const showLoteLabel = nomeVitrine && !hideLoteNome

            return (
              <div
                key={lote.id}
                className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  {showLoteLabel ? (
                    <p className="text-sm font-medium text-zinc-300">
                      {nomeVitrine}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-white">
                      {evento.nome}
                    </p>
                  )}
                  <div className={showLoteLabel ? 'mt-1' : 'mt-0.5'}>
                    <LotePrecoPromo
                      preco={lote.preco}
                      precoDe={lote.precoDe}
                      size="sm"
                      showLabel
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {lote.disponiveis} disponíveis
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full shrink-0 sm:w-auto"
                  isDisabled={lote.disponiveis < 1}
                  onPress={() => onComprar(lote)}
                >
                  Comprar ingresso
                </Button>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          {formatEventDate(evento.dataInicio)}
        </p>
      </div>
    </Card>
  )
}
