'use client'

import { Button, Card } from '@heroui/react'
import { ArrowLeft, CheckCircle2, FileText, PlayCircle } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ParticipantShell } from '@/components/layout/participant-shell'
import { CursoAulaVideoPlayer } from '@/components/cursos/curso-aula-video-player'
import { useRequireParticipant } from '@/hooks/use-require-participant'
import { ApiError, apiFetch } from '@/lib/api-client'
import type { CursoAula, CursoDetalhe } from '@/types/cursos'

function aulaIcon(tipo: CursoAula['tipo']) {
  if (tipo === 'VIDEO') return PlayCircle
  if (tipo === 'PDF') return FileText
  return FileText
}

export default function CursoAlunoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { isReady } = useRequireParticipant()
  const cursoId = params.id

  const [curso, setCurso] = useState<CursoDetalhe | null>(null)
  const [aulaAtivaId, setAulaAtivaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSavingProgress, setIsSavingProgress] = useState(false)

  const loadCurso = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<CursoDetalhe>(`/cursos/${cursoId}`)
      setCurso(data)

      const primeiraAula = data.modulos[0]?.aulas[0]?.id ?? null
      setAulaAtivaId((atual) => atual ?? primeiraAula)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar curso')
    } finally {
      setIsLoading(false)
    }
  }, [cursoId])

  useEffect(() => {
    if (!isReady) return
    void loadCurso()
  }, [isReady, loadCurso])

  const aulaAtiva = useMemo(() => {
    if (!curso || !aulaAtivaId) return null

    for (const modulo of curso.modulos) {
      const aula = modulo.aulas.find((item) => item.id === aulaAtivaId)
      if (aula) return aula
    }

    return null
  }, [curso, aulaAtivaId])

  async function marcarConcluida() {
    if (!aulaAtiva) return

    setIsSavingProgress(true)

    try {
      await apiFetch(`/cursos/aulas/${aulaAtiva.id}/progresso`, {
        method: 'POST',
        body: JSON.stringify({ concluida: true }),
      })
      await loadCurso()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar progresso')
    } finally {
      setIsSavingProgress(false)
    }
  }

  if (!isReady) {
    return null
  }

  if (isLoading) {
    return (
      <ParticipantShell title="Curso" subtitle="Carregando...">
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Carregando curso...</p>
        </Card>
      </ParticipantShell>
    )
  }

  if (!curso) {
    return (
      <ParticipantShell title="Curso" subtitle="Indisponível">
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-red-300">{error ?? 'Curso não encontrado'}</p>
        </Card>
      </ParticipantShell>
    )
  }

  return (
    <ParticipantShell title={curso.titulo} subtitle="Acompanhe módulos e aulas">
      <div className="mb-4">
        <Button variant="secondary" onPress={() => router.push('/ingressos/cursos')}>
          <ArrowLeft className="size-4" aria-hidden />
          Meus cursos
        </Button>
      </div>

      {error ? (
        <Card className="glass-panel mb-4 rounded-2xl border-red-500/30 p-4">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="glass-panel rounded-2xl border-white/10 p-4">
          <h2 className="mb-3 text-sm font-medium text-white">Conteúdo</h2>

          <div className="space-y-4">
            {curso.modulos.map((modulo) => (
              <div key={modulo.id}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {modulo.titulo}
                </p>
                <ul className="space-y-1">
                  {modulo.aulas.map((aula) => {
                    const Icon = aulaIcon(aula.tipo)
                    const isActive = aula.id === aulaAtivaId

                    return (
                      <li key={aula.id}>
                        <button
                          type="button"
                          onClick={() => setAulaAtivaId(aula.id)}
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                            isActive
                              ? 'bg-violet-500/15 text-white'
                              : 'text-zinc-300 hover:bg-white/5'
                          }`}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden />
                          <span className="min-w-0 flex-1 truncate">{aula.titulo}</span>
                          {aula.concluida ? (
                            <CheckCircle2
                              className="size-4 shrink-0 text-emerald-400"
                              aria-label="Concluída"
                            />
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel rounded-2xl border-white/10 p-4">
          {!aulaAtiva ? (
            <p className="text-sm text-zinc-400">Selecione uma aula.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{aulaAtiva.titulo}</h3>
                <p className="mt-1 text-xs text-zinc-500">{aulaAtiva.tipo}</p>
              </div>

              {aulaAtiva.tipo === 'VIDEO' ? (
                <CursoAulaVideoPlayer
                  titulo={aulaAtiva.titulo}
                  conteudoUrl={aulaAtiva.conteudoUrl ?? ''}
                />
              ) : null}

              {aulaAtiva.tipo === 'PDF' && aulaAtiva.conteudoUrl ? (
                <a
                  href={aulaAtiva.conteudoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-violet-300 hover:bg-white/10"
                >
                  Abrir PDF
                </a>
              ) : null}

              {aulaAtiva.tipo === 'TEXTO' && aulaAtiva.conteudoTexto ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
                  {aulaAtiva.conteudoTexto}
                </div>
              ) : null}

              {!aulaAtiva.concluida ? (
                <Button
                  variant="primary"
                  isDisabled={isSavingProgress}
                  onPress={() => void marcarConcluida()}
                >
                  Marcar como concluída
                </Button>
              ) : (
                <p className="flex items-center gap-2 text-sm text-emerald-300">
                  <CheckCircle2 className="size-4" aria-hidden />
                  Aula concluída
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </ParticipantShell>
  )
}
