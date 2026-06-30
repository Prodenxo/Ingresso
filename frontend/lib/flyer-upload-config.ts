const DEFAULT_FLYER_MAX_MB = 15

export function getFlyerMaxMb(): number {
  const fromEnv = Number(process.env.NEXT_PUBLIC_FLYER_MAX_MB)

  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv
  }

  return DEFAULT_FLYER_MAX_MB
}

export function getFlyerMaxBytes(): number {
  return getFlyerMaxMb() * 1024 * 1024
}

export function getFlyerMaxMbLabel(): string {
  return `${getFlyerMaxMb()} MB`
}
