const DEFAULT_FLYER_MAX_MB = 15

export function getFlyerMaxBytes(): number {
  const fromEnv = Number(process.env.FLYER_MAX_MB)

  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.floor(fromEnv * 1024 * 1024)
  }

  return DEFAULT_FLYER_MAX_MB * 1024 * 1024
}

export function getFlyerMaxMbLabel(): string {
  return `${Math.round(getFlyerMaxBytes() / (1024 * 1024))} MB`
}
