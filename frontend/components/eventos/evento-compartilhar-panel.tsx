'use client'

import { Button, Card } from '@heroui/react'
import { Copy, ExternalLink, Link2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buildEventoPublicoUrl } from '@/lib/evento-publico'

interface EventoCompartilharPanelProps {
  eventoId: string
  eventoNome: string
  publicado: boolean
}

export function EventoCompartilharPanel({
  eventoId,
  eventoNome,
  publicado,
}: EventoCompartilharPanelProps) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const publicUrl = origin ? buildEventoPublicoUrl(origin, eventoId) : ''

  async function handleCopy() {
    if (!publicUrl) return

    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!publicado) {
    return (
      <Card className="glass-panel mb-6 rounded-2xl border-white/10 p-5">
        <div className="flex items-start gap-3">
          <Link2 className="mt-0.5 size-5 shrink-0 text-zinc-500" aria-hidden />
          <div>
            <h2 className="font-medium text-white">Link público do evento</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Publique o evento para gerar o link de divulgação (como na Sympla).
              Qualquer pessoa poderá ver a página e comprar ingresso.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="glass-panel mb-6 rounded-2xl border-indigo-500/20 bg-indigo-500/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-medium text-white">Divulgue o evento</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Copie o link público de <span className="text-zinc-200">{eventoNome}</span>.
            Não exige login para visualizar — na hora da compra a pessoa cria conta.
          </p>
          {publicUrl ? (
            <p className="mt-3 break-all font-mono text-sm text-indigo-300">
              {publicUrl}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {publicUrl ? (
            <>
              <Button variant="primary" size="sm" onPress={() => void handleCopy()}>
                <Copy className="size-3.5" aria-hidden />
                {copied ? 'Copiado!' : 'Copiar link'}
              </Button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                <ExternalLink className="size-3.5" aria-hidden />
                Abrir página
              </a>
            </>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
