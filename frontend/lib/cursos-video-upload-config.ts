export const CURSO_VIDEO_MAX_MB = 200

export function getCursoVideoMaxBytes(): number {
  return CURSO_VIDEO_MAX_MB * 1024 * 1024
}

export function getCursoVideoMaxMbLabel(): string {
  return `${CURSO_VIDEO_MAX_MB} MB`
}
