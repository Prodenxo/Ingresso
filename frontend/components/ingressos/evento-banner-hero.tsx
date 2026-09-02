'use client'

import { useState } from 'react'
import { X, ZoomIn } from 'lucide-react'
import { resolveMediaUrl } from '@/lib/media-url'

interface EventoBannerHeroProps {
  bannerUrl: string | null
  nome: string
}

export function EventoBannerHero({ bannerUrl, nome }: EventoBannerHeroProps) {
  const [expanded, setExpanded] = useState(false)
  const src = resolveMediaUrl(bannerUrl)

  if (!src) return null

  return (
    <>
      <button
        type="button"
        className="group relative block w-full border-b border-white/8 bg-[#050508] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        onClick={() => setExpanded(true)}
        aria-label={`Ampliar banner de ${nome}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="mx-auto max-h-56 w-full object-contain sm:max-h-80"
        />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs text-zinc-200 opacity-0 transition group-hover:opacity-100">
          <ZoomIn className="size-3.5" aria-hidden />
          Ampliar
        </span>
      </button>

      {expanded ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Banner ${nome}`}
          onClick={() => setExpanded(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setExpanded(false)}
            aria-label="Fechar"
          >
            <X className="size-5" aria-hidden />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={nome}
            className="max-h-[92vh] max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  )
}
