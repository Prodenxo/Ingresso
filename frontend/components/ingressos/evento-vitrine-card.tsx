'use client'

import { Button, Card } from '@heroui/react'
import { MapPin } from 'lucide-react'
import { EventoPoster } from '@/components/ingressos/evento-poster'
import { LotePrecoPromo } from '@/components/ingressos/lote-preco-promo'
import {
  formatEventDate,
  formatEventDateBadge,
  formatLocation,
  getLoteNomeVitrine,
} from '@/lib/ingressos-utils'
import type { EventoDisponivel, LoteDisponivel } from '@/types/ingressos'

interface EventoVitrineCardProps {
  evento: EventoDisponivel
  onComprar: (lote: LoteDisponivel) => void
}

export function EventoVitrineCard({ evento, onComprar }: EventoVitrineCardProps) {
  const location = formatLocation(evento)
  const dateBadge = formatEventDateBadge(evento.dataInicio)
  const totalLotes = evento.lotes.length

  return (
    <Card className="glass-panel overflow-hidden rounded-2xl border-white/10 p-0">
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        <EventoPoster
          imagemUrl={evento.imagemUrl}
          bannerUrl={evento.bannerUrl}
          nome={evento.nome}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {evento.empresa.nome}
          </p>
          <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-snug text-white">
            {evento.nome}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
              <div className="text-center leading-none">
                <p className="text-[10px] font-medium uppercase text-indigo-300">
                  {dateBadge.month}
                </p>
                <p className="text-lg font-bold text-white">{dateBadge.day}</p>
              </div>
              <div className="border-l border-white/10 pl-2 text-xs text-zinc-400">
                <p className="capitalize text-zinc-300">{dateBadge.weekday}</p>
                <p>{dateBadge.time}</p>
              </div>
            </div>

            {location ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {location}
              </span>
            ) : null}
          </div>

          {evento.endereco ? (
            <p className="mt-2 line-clamp-1 text-xs text-zinc-500">
              {evento.endereco}
            </p>
          ) : null}

          {evento.descricao ? (
            <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
              {evento.descricao}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/8 bg-black/20 px-4 py-3 sm:px-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Ingressos
        </p>
        <div className="space-y-2">
          {evento.lotes.map((lote, index) => {
            const nomeVitrine = getLoteNomeVitrine(lote.nome, index, totalLotes)

            return (
              <div
                key={lote.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 sm:px-4"
              >
                <div className="min-w-0">
                  {nomeVitrine ? (
                    <p className="font-medium text-white">{nomeVitrine}</p>
                  ) : null}
                  <div className={nomeVitrine ? 'mt-0.5' : undefined}>
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
                  isDisabled={lote.disponiveis < 1}
                  onPress={() => onComprar(lote)}
                >
                  Comprar
                </Button>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          {formatEventDate(evento.dataInicio)}
        </p>
      </div>
    </Card>
  )
}
