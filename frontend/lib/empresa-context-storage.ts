const STORAGE_KEY = 'ingresso:empresa-ativa'

export function getEmpresaAtivaId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return localStorage.getItem(STORAGE_KEY)
}

export function setEmpresaAtivaId(empresaId: string): void {
  localStorage.setItem(STORAGE_KEY, empresaId)
}

export function clearEmpresaAtivaId(): void {
  localStorage.removeItem(STORAGE_KEY)
}
