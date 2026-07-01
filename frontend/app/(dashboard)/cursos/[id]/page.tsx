'use client'

import { Button, Card, Chip } from '@heroui/react'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { AulaVideoUploadButton } from '@/components/cursos/aula-video-upload-button'
import { CriarAulaModal } from '@/components/cursos/criar-aula-modal'
import { AdminShell } from '@/components/layout/admin-shell'
import { FormField } from '@/components/ui/form-field'
import { ApiError, apiFetch } from '@/lib/api-client'
import type { CursoDetalhe } from '@/types/cursos'

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    PUBLICADO: 'Publicado',
    ARQUIVADO: 'Arquivado',
  }

  return labels[status] ?? status
}

export default function CursoAdminDetalhePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const cursoId = params.id

  const [curso, setCurso] = useState<CursoDetalhe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [aulaModalModuloId, setAulaModalModuloId] = useState<string | null>(null)

  const loadCurso = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<CursoDetalhe>(`/cursos/admin/${cursoId}`)
      setCurso(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar curso')
    } finally {
      setIsLoading(false)
    }
  }, [cursoId])

  useEffect(() => {
    void loadCurso()
  }, [loadCurso])

  async function salvarCurso() {
    if (!curso) return

    setIsSaving(true)
    setError(null)

    try {
      await apiFetch(`/cursos/admin/${curso.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          titulo: curso.titulo,
          descricao: curso.descricao,
          capaUrl: curso.capaUrl,
          status: curso.status,
        }),
      })

      await loadCurso()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar curso')
    } finally {
      setIsSaving(false)
    }
  }

  async function adicionarModulo() {
    const titulo = window.prompt('Título do módulo')
    if (!titulo?.trim()) return

    try {
      await apiFetch(`/cursos/admin/${cursoId}/modulos`, {
        method: 'POST',
        body: JSON.stringify({ titulo: titulo.trim() }),
      })
      await loadCurso()
    } catch {
      window.alert('Não foi possível criar o módulo')
    }
  }

  async function removerModulo(moduloId: string) {
    if (!window.confirm('Remover este módulo e todas as aulas?')) return

    try {
      await apiFetch(`/cursos/admin/modulos/${moduloId}`, { method: 'DELETE' })
      await loadCurso()
    } catch {
      window.alert('Não foi possível remover o módulo')
    }
  }

  async function removerAula(aulaId: string) {
    if (!window.confirm('Remover esta aula?')) return

    try {
      await apiFetch(`/cursos/admin/aulas/${aulaId}`, { method: 'DELETE' })
      await loadCurso()
    } catch {
      window.alert('Não foi possível remover a aula')
    }
  }

  if (isLoading) {
    return (
      <AdminShell title="Curso" subtitle="Carregando...">
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Carregando curso...</p>
        </Card>
      </AdminShell>
    )
  }

  if (!curso) {
    return (
      <AdminShell title="Curso" subtitle="Não encontrado">
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-red-300">{error ?? 'Curso não encontrado'}</p>
        </Card>
      </AdminShell>
    )
  }

  return (
    <AdminShell title={curso.titulo} subtitle="Edite módulos, aulas e publicação">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="secondary" onPress={() => router.push('/cursos')}>
          <ArrowLeft className="size-4" aria-hidden />
          Voltar
        </Button>
        <Button variant="primary" isDisabled={isSaving} onPress={() => void salvarCurso()}>
          Salvar
        </Button>
      </div>

      {error ? (
        <Card className="glass-panel mb-4 rounded-2xl border-red-500/30 p-4">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel rounded-2xl border-white/10 p-4">
          <h2 className="mb-4 text-sm font-medium text-white">Informações</h2>

          <div className="space-y-4">
            <FormField
              label="Título"
              value={curso.titulo}
              onChange={(event) =>
                setCurso({ ...curso, titulo: event.target.value })
              }
            />

            <FormField
              label="Descrição"
              value={curso.descricao ?? ''}
              onChange={(event) =>
                setCurso({ ...curso, descricao: event.target.value || null })
              }
            />

            <FormField
              label="URL da capa"
              value={curso.capaUrl ?? ''}
              onChange={(event) =>
                setCurso({ ...curso, capaUrl: event.target.value || null })
              }
            />

            <label className="block text-sm">
              <span className="mb-1.5 block text-zinc-400">
                Status
              </span>
              <select
                value={curso.status}
                onChange={(event) =>
                  setCurso({
                    ...curso,
                    status: event.target.value as CursoDetalhe['status'],
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
              >
                <option value="RASCUNHO">Rascunho</option>
                <option value="PUBLICADO">Publicado</option>
                <option value="ARQUIVADO">Arquivado</option>
              </select>
            </label>

            <Chip size="sm">{statusLabel(curso.status)}</Chip>
          </div>
        </Card>

        <Card className="glass-panel rounded-2xl border-white/10 p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-white">Módulos e aulas</h2>
            <Button size="sm" variant="secondary" onPress={() => void adicionarModulo()}>
              <Plus className="size-4" aria-hidden />
              Módulo
            </Button>
          </div>

          {curso.modulos.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhum módulo cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {curso.modulos.map((modulo) => (
                <div
                  key={modulo.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-medium text-white">{modulo.titulo}</h3>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => setAulaModalModuloId(modulo.id)}
                      >
                        <Plus className="size-3.5" aria-hidden />
                        Aula
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => void removerModulo(modulo.id)}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>

                  {modulo.aulas.length === 0 ? (
                    <p className="text-xs text-zinc-500">Sem aulas</p>
                  ) : (
                    <ul className="space-y-1">
                      {modulo.aulas.map((aula) => (
                        <li
                          key={aula.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-2 py-1.5 text-sm"
                        >
                          <span className="min-w-0 flex-1 truncate text-zinc-200">
                            {aula.titulo}{' '}
                            <span className="text-xs text-zinc-500">
                              ({aula.tipo})
                            </span>
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            {aula.tipo === 'VIDEO' ? (
                              <AulaVideoUploadButton
                                aulaId={aula.id}
                                onUploaded={() => void loadCurso()}
                              />
                            ) : null}
                            <button
                              type="button"
                              onClick={() => void removerAula(aula.id)}
                              className="text-zinc-500 hover:text-red-300"
                              aria-label={`Remover aula ${aula.titulo}`}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <CriarAulaModal
        isOpen={Boolean(aulaModalModuloId)}
        moduloId={aulaModalModuloId}
        onClose={() => setAulaModalModuloId(null)}
        onSuccess={() => void loadCurso()}
      />
    </AdminShell>
  )
}
