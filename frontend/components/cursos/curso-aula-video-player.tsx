'use client'

import { useEffect, useState } from 'react'
import { resolveMediaUrl } from '@/lib/media-url'
import { resolveVideoSource } from '@/lib/video-embed'

interface CursoAulaVideoPlayerProps {
  titulo: string
  conteudoUrl: string
}

export function CursoAulaVideoPlayer({
  titulo,
  conteudoUrl,
}: CursoAulaVideoPlayerProps) {
  const [origin, setOrigin] = useState<string | undefined>()

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const mediaUrl = resolveMediaUrl(conteudoUrl) ?? conteudoUrl
  const source = resolveVideoSource(mediaUrl, { origin })

  if (!source) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center">
        <p className="text-sm text-zinc-400">URL de vídeo inválida ou ausente.</p>
      </div>
    )
  }

  if (source.kind === 'video') {
    return (
      <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
        <video
          key={source.src}
          src={source.src}
          title={titulo}
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
          className="h-full w-full bg-black object-contain"
        >
          Seu navegador não suporta reprodução de vídeo.
        </video>
      </div>
    )
  }

  if (source.kind === 'iframe') {
    return (
      <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
        <iframe
          key={source.src}
          src={source.src}
          title={titulo}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }

  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-center">
      <p className="text-sm text-zinc-300">
        Envie um arquivo MP4 no admin ou use link do YouTube/Vimeo.
      </p>
      <a
        href={source.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-violet-300 underline-offset-2 hover:underline"
      >
        Abrir link original
      </a>
    </div>
  )
}
