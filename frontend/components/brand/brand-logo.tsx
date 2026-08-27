import {
  BRAND_LOGO_SRC,
  BRAND_NAME,
  BRAND_WORDMARK_SUFFIX,
} from '@/lib/brand'
import { cn } from '@/lib/utils'

const LOGO_HEIGHT = {
  xs: 'h-6',
  sm: 'h-7',
  md: 'h-8',
  lg: 'h-10',
  xl: 'h-14',
} as const

const SUFFIX_TRACKING = {
  xs: 'tracking-[0.34em]',
  sm: 'tracking-[0.36em]',
  md: 'tracking-[0.38em]',
  lg: 'tracking-[0.4em]',
  xl: 'tracking-[0.42em]',
} as const

const SUFFIX_SIZE = {
  xs: 'text-[8px]',
  sm: 'text-[9px]',
  md: 'text-[10px]',
  lg: 'text-[11px]',
  xl: 'text-xs',
} as const

type BrandSize = keyof typeof LOGO_HEIGHT

interface BrandLogoProps {
  size?: BrandSize
  className?: string
}

function BrandLogo({ size = 'md', className }: BrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_LOGO_SRC}
      alt=""
      aria-hidden
      className={cn(
        'w-auto shrink-0 object-contain brightness-0 invert',
        LOGO_HEIGHT[size],
        className,
      )}
    />
  )
}

function BrandSuffix({
  size,
  className,
}: {
  size: BrandSize
  className?: string
}) {
  return (
    <span
      className={cn(
        'font-sans font-normal lowercase text-white/50',
        SUFFIX_SIZE[size],
        SUFFIX_TRACKING[size],
        className,
      )}
    >
      {BRAND_WORDMARK_SUFFIX}
    </span>
  )
}

interface BrandWordmarkProps {
  size?: BrandSize
  centered?: boolean
  className?: string
}

export function BrandWordmark({
  size = 'md',
  centered = false,
  className,
}: BrandWordmarkProps) {
  return (
    <div
      className={cn(
        'inline-flex flex-col gap-1',
        centered ? 'items-center' : 'items-start',
        className,
      )}
      aria-label={BRAND_NAME}
    >
      <BrandLogo size={size} />
      <BrandSuffix size={size} className={centered ? 'text-center' : 'pl-[0.15em]'} />
    </div>
  )
}

interface BrandMarkProps {
  size?: BrandSize
  className?: string
}

export function BrandMark({ size = 'md', className }: BrandMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_LOGO_SRC}
      alt={BRAND_NAME}
      className={cn(
        'w-auto shrink-0 object-contain brightness-0 invert',
        LOGO_HEIGHT[size],
        className,
      )}
    />
  )
}

interface BrandHeaderProps {
  subtitle?: string
  centered?: boolean
  size?: BrandSize
  subtitleClassName?: string
  className?: string
}

export function BrandHeader({
  subtitle,
  centered = false,
  size = 'sm',
  subtitleClassName,
  className,
}: BrandHeaderProps) {
  return (
    <div className={cn('space-y-3', centered && 'text-center', className)}>
      <BrandWordmark size={size} centered={centered} />
      {subtitle ? (
        <h1
          className={cn(
            'bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-xl font-semibold text-transparent',
            subtitleClassName,
          )}
        >
          {subtitle}
        </h1>
      ) : null}
    </div>
  )
}

interface BrandHeroProps {
  className?: string
}

export function BrandHero({ className }: BrandHeroProps) {
  return <BrandWordmark size="xl" centered className={className} />
}

interface BrandAuthHeaderProps {
  className?: string
}

export function BrandAuthHeader({ className }: BrandAuthHeaderProps) {
  return <BrandWordmark size="lg" centered className={className} />
}

interface BrandNavbarProps {
  className?: string
}

export function BrandNavbar({ className }: BrandNavbarProps) {
  return <BrandWordmark size="xs" className={className} />
}
