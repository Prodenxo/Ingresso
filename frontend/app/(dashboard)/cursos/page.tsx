'use client'

import { Button, Card, Chip } from '@heroui/react'
import { GraduationCap, Plus, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CriarCursoModal } from '@/components/cursos/criar-curso-modal'
import { AdminShell } from '@/components/layout/admin-shell'
import { ApiError, apiFetch } from '@/lib/api-client'
import type { CursoAdminResumo } from '@/types/cursos'

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    PUBLICADO: 'Publicado',
    ARQUIVADO: 'Arquivado',
  }

  return labels[status] ?? status
}

function statusColor(status: string): 'default' | 'success' | 'warning' {
  if (status === 'PUBLICADO') return 'success'
  if (status === 'RASCUNHO') return 'warning'
  return 'default'
}

export default function CursosAdminPage() {
  const router = useRouter()
  const [cursos, setCursos] = useState<CursoAdminResumo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    void apiFetch<CursoAdminResumo[]>('/cursos/admin')
      .then(setCursos)
      .catch(() => setCursos([]))
      .finally(() => setIsLoading(false))
  }, [])

  async function handleNovoCurso(titulo: string) {
    setIsCreating(true)
    setCreateError(null)

    try {
      const result = await apiFetch<{ id: string }>('/cursos/admin', {
        method: 'POST',
        body: JSON.stringify({ titulo: titulo.trim() }),
      })

      setModalAberto(false)
      router.push(`/cursos/${result.id}`)
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : 'Não foi possível criar o curso',
      )
    } finally {
      setIsCreating(false)
    }
  }

  function abrirModal() {
    setCreateError(null)
    setModalAberto(true)
  }

  function fecharModal() {
    if (isCreating) return
    setModalAberto(false)
    setCreateError(null)
  }

  return (
    <AdminShell
      title="Cursos"
      subtitle="Gerencie conteúdos, módulos e permissões de acesso"
    >
      <div className="mb-6 flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          onPress={() => router.push('/cursos/permissoes')}
        >
          <Users className="size-4" aria-hidden />
          Permissões
        </Button>
        <Button variant="primary" isDisabled={isCreating} onPress={abrirModal}>
          <Plus className="size-4" aria-hidden />
          Novo curso
        </Button>
      </div>

      <CriarCursoModal
        isOpen={modalAberto}
        isLoading={isCreating}
        error={createError}
        onClose={fecharModal}
        onConfirm={handleNovoCurso}
      />

      {isLoading ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Carregando cursos...</p>
        </Card>
      ) : cursos.length === 0 ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-8 text-center">
          <GraduationCap className="mx-auto size-10 text-zinc-500" aria-hidden />
          <h3 className="mt-4 text-lg font-medium text-white">Nenhum curso criado</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Crie seu primeiro curso e libere o acesso para membros selecionados.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {cursos.map((curso) => (
            <button
              key={curso.id}
              type="button"
              onClick={() => router.push(`/cursos/${curso.id}`)}
              className="w-full text-left"
            >
              <Card className="glass-panel rounded-2xl border-white/10 p-0 transition-colors hover:border-white/20">
                <div className="flex items-center gap-4 p-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  <GraduationCap className="size-6" aria-hidden />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">
                        {curso.titulo}
                      </h3>
                      {curso.descricao ? (
                        <p className="mt-1 line-clamp-1 text-sm text-zinc-400">
                          {curso.descricao}
                        </p>
                      ) : null}
                    </div>
                    <Chip size="sm" color={statusColor(curso.status)}>
                      {statusLabel(curso.status)}
                    </Chip>
                  </div>

                  <p className="mt-2 text-xs text-zinc-500">
                    {curso.totalModulos} módulos · {curso.totalAlunos} alunos
                  </p>
                </div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
