'use client'

import { Card } from '@heroui/react'
import { GraduationCap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ParticipantShell } from '@/components/layout/participant-shell'
import { useRequireParticipant } from '@/hooks/use-require-participant'
import { apiFetch } from '@/lib/api-client'
import { temAcessoCursos } from '@/lib/auth-roles'
import type { CursoAlunoResumo } from '@/types/cursos'

export default function MeusCursosPage() {
  const router = useRouter()
  const { user, isReady } = useRequireParticipant()
  const [cursos, setCursos] = useState<CursoAlunoResumo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isReady) return

    if (!temAcessoCursos(user)) {
      router.replace('/ingressos')
      return
    }

    void apiFetch<CursoAlunoResumo[]>('/cursos/meus')
      .then(setCursos)
      .catch(() => setCursos([]))
      .finally(() => setIsLoading(false))
  }, [isReady, user, router])

  if (!isReady) {
    return null
  }

  return (
    <ParticipantShell title="Cursos" subtitle="Conteúdos liberados para você">
      {isLoading ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Carregando cursos...</p>
        </Card>
      ) : cursos.length === 0 ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-8 text-center">
          <GraduationCap className="mx-auto size-10 text-zinc-500" aria-hidden />
          <h3 className="mt-4 text-lg font-medium text-white">
            Nenhum curso liberado
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            Quando a empresa liberar cursos para você, eles aparecerão aqui.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cursos.map((curso) => (
            <button
              key={curso.id}
              type="button"
              onClick={() => router.push(`/ingressos/cursos/${curso.id}`)}
              className="w-full text-left"
            >
              <Card className="glass-panel rounded-2xl border-white/10 p-0 transition-colors hover:border-white/20">
                <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    <GraduationCap className="size-5" aria-hidden />
                  </div>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300">
                    {curso.progressoPct}%
                  </span>
                </div>

                <h3 className="font-semibold text-white">{curso.titulo}</h3>
                <p className="mt-1 text-xs text-zinc-500">{curso.empresaNome}</p>

                {curso.descricao ? (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                    {curso.descricao}
                  </p>
                ) : null}

                <p className="mt-3 text-xs text-zinc-500">
                  {curso.totalModulos} módulos · {curso.totalAulas} aulas
                </p>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-violet-400 transition-all"
                    style={{ width: `${curso.progressoPct}%` }}
                  />
                </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </ParticipantShell>
  )
}
