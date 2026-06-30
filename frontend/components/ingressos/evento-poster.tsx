'use client'

import { CalendarDays, ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { resolveMediaUrl } from '@/lib/media-url'
import { cn } from '@/lib/utils'

interface EventoPosterProps {
  imagemUrl?: string | null
  bannerUrl?: string | null
  nome: string
  size?: 'sm' | 'md'
  className?: string
}

function PosterPlaceholder({
  size,
  className,
}: {
  size: 'sm' | 'md'
  className?: string
}) {
  const sizeClass =
    size === 'sm' ? 'h-[88px] w-[66px]' : 'h-[120px] w-[90px]'

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-indigo-500/20 to-violet-500/10 text-indigo-300/80',
        sizeClass,
        className,
      )}
      aria-hidden
    >
      <CalendarDays className="size-5" />
      <ImageIcon className="mt-1 size-3 opacity-60" />
    </div>
  )
}

export function EventoPoster({
  imagemUrl,
  bannerUrl,
  nome,
  size = 'md',
  className,
}: EventoPosterProps) {
  const [hasError, setHasError] = useState(false)
  const src = resolveMediaUrl(imagemUrl ?? bannerUrl)
  const sizeClass =
    size === 'sm' ? 'h-[88px] w-[66px]' : 'h-[120px] w-[90px]'

  if (!src || hasError) {
    return <PosterPlaceholder size={size} className={className} />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Capa ${nome}`}
      className={cn(
        'shrink-0 rounded-lg border border-white/10 object-cover shadow-sm',
        sizeClass,
        className,
      )}
      onError={() => setHasError(true)}
    />
  )
}
