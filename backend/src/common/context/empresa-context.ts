import { AsyncLocalStorage } from 'node:async_hooks'

interface EmpresaContextStore {
  empresaId?: string
}

export const empresaContextStorage = new AsyncLocalStorage<EmpresaContextStore>()

export function getEmpresaContextOverride(): string | undefined {
  return empresaContextStorage.getStore()?.empresaId
}

export function runWithEmpresaContext<T>(
  empresaId: string | undefined,
  fn: () => T,
): T {
  return empresaContextStorage.run({ empresaId }, fn)
}
