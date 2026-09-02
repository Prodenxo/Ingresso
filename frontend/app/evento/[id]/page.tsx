import { Suspense } from 'react'
import EventoPublicoPage from './evento-publico-content'

export default function EventoPublicoRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07070d]">
          <p className="text-sm text-zinc-400">Carregando evento...</p>
        </div>
      }
    >
      <EventoPublicoPage />
    </Suspense>
  )
}
