'use client'

import { Button, Card } from '@heroui/react'
import { ArrowLeft, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { AdminShell } from '@/components/layout/admin-shell'
import { ApiError, apiFetch } from '@/lib/api-client'
import type { PermissoesCursoUsuario, UsuarioPermissaoCurso } from '@/types/cursos'

export default function CursosPermissoesPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<UsuarioPermissaoCurso[]>([])
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<string | null>(null)
  const [permissoes, setPermissoes] = useState<PermissoesCursoUsuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadUsuarios = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<UsuarioPermissaoCurso[]>(
        '/cursos/admin/permissoes/usuarios',
      )
      setUsuarios(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar usuários')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsuarios()
  }, [loadUsuarios])

  async function selecionarUsuario(usuarioId: string) {
    setUsuarioSelecionado(usuarioId)
    setPermissoes(null)
    setError(null)
    setSuccess(null)

    try {
      const data = await apiFetch<PermissoesCursoUsuario>(
        `/cursos/admin/permissoes/${usuarioId}`,
      )
      setPermissoes(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar permissões')
    }
  }

  function toggleCurso(cursoId: string) {
    if (!permissoes) return

    setPermissoes({
      ...permissoes,
      cursos: permissoes.cursos.map((curso) =>
        curso.id === cursoId ? { ...curso, liberado: !curso.liberado } : curso,
      ),
    })
  }

  async function salvarPermissoes() {
    if (!permissoes || !usuarioSelecionado) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await apiFetch(`/cursos/admin/permissoes/${usuarioSelecionado}`, {
        method: 'PUT',
        body: JSON.stringify({
          acessoCursos: permissoes.acessoCursos,
          cursoIds: permissoes.cursos
            .filter((curso) => curso.liberado)
            .map((curso) => curso.id),
        }),
      })

      setSuccess('Permissões salvas com sucesso')
      await loadUsuarios()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar permissões')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminShell
      title="Permissões de cursos"
      subtitle="Defina quem acessa o módulo e quais cursos cada membro pode ver"
    >
      <div className="mb-4">
        <Button variant="secondary" onPress={() => router.push('/cursos')}>
          <ArrowLeft className="size-4" aria-hidden />
          Voltar
        </Button>
      </div>

      {error ? (
        <Card className="glass-panel mb-4 rounded-2xl border-red-500/30 p-4">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      ) : null}

      {success ? (
        <Card className="glass-panel mb-4 rounded-2xl border-emerald-500/30 p-4">
          <p className="text-sm text-emerald-300">{success}</p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="glass-panel rounded-2xl border-white/10 p-4">
          <h2 className="mb-3 text-sm font-medium text-white">Usuários vinculados</h2>

          {isLoading ? (
            <p className="text-sm text-zinc-400">Carregando...</p>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhum usuário vinculado.</p>
          ) : (
            <ul className="space-y-2" aria-label="Usuários">
              {usuarios.map((usuario) => {
                const isActive = usuarioSelecionado === usuario.usuarioId

                return (
                  <li key={usuario.usuarioId}>
                    <button
                      type="button"
                      onClick={() => void selecionarUsuario(usuario.usuarioId)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        isActive
                          ? 'border-violet-400/40 bg-violet-500/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <p className="truncate text-sm font-medium text-white">
                        {usuario.nome}
                      </p>
                      <p className="truncate text-xs text-zinc-400">{usuario.email}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {usuario.acessoCursos
                          ? `${usuario.totalCursosLiberados} curso(s)`
                          : 'Sem acesso'}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card className="glass-panel rounded-2xl border-white/10 p-4">
          {!permissoes ? (
            <p className="text-sm text-zinc-400">
              Selecione um usuário para configurar o acesso.
            </p>
          ) : (
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <input
                  type="checkbox"
                  checked={permissoes.acessoCursos}
                  onChange={(event) =>
                    setPermissoes({
                      ...permissoes,
                      acessoCursos: event.target.checked,
                    })
                  }
                  className="size-4 rounded border-white/20"
                />
                <span className="text-sm text-white">
                  Liberar acesso ao módulo de cursos
                </span>
              </label>

              {permissoes.acessoCursos ? (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-white">Cursos liberados</h3>

                  {permissoes.cursos.length === 0 ? (
                    <p className="text-sm text-zinc-400">
                      Nenhum curso cadastrado ainda.
                    </p>
                  ) : (
                    <ul className="space-y-2" aria-label="Cursos">
                      {permissoes.cursos.map((curso) => (
                        <li key={curso.id}>
                          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={curso.liberado}
                              onChange={() => toggleCurso(curso.id)}
                              className="size-4 rounded border-white/20"
                            />
                            <span className="text-sm text-zinc-200">{curso.titulo}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              <Button
                variant="primary"
                isDisabled={isSaving}
                onPress={() => void salvarPermissoes()}
              >
                <Save className="size-4" aria-hidden />
                Salvar permissões
              </Button>
            </div>
          )}
        </Card>
      </div>
    </AdminShell>
  )
}
