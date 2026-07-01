'use client'

import { useEffect, useRef, useState } from 'react'
import { FormField } from '@/components/ui/form-field'
import { GlassModal, GlassModalActions } from '@/components/ui/glass-modal'
import { ApiError, apiFetch, apiUpload } from '@/lib/api-client'
import {
  getCursoVideoMaxBytes,
  getCursoVideoMaxMbLabel,
} from '@/lib/cursos-video-upload-config'
import type { TipoCursoAula } from '@/types/cursos'

interface CriarAulaModalProps {
  isOpen: boolean
  moduloId: string | null
  onClose: () => void
  onSuccess: () => void
}

type FonteVideo = 'arquivo' | 'link'

export function CriarAulaModal({
  isOpen,
  moduloId,
  onClose,
  onSuccess,
}: CriarAulaModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoCursoAula>('VIDEO')
  const [fonteVideo, setFonteVideo] = useState<FonteVideo>('arquivo')
  const [conteudoUrl, setConteudoUrl] = useState('')
  const [conteudoTexto, setConteudoTexto] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setTitulo('')
      setTipo('VIDEO')
      setFonteVideo('arquivo')
      setConteudoUrl('')
      setConteudoTexto('')
      setArquivo(null)
      setError(null)
    }
  }, [isOpen])

  function handleArquivoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setError(null)

    if (!file) {
      setArquivo(null)
      return
    }

    if (!file.type.startsWith('video/')) {
      setError('Selecione um arquivo de vídeo (MP4, WebM)')
      setArquivo(null)
      return
    }

    if (file.size > getCursoVideoMaxBytes()) {
      setError(`O vídeo deve ter no máximo ${getCursoVideoMaxMbLabel()}`)
      setArquivo(null)
      return
    }

    setArquivo(file)
  }

  async function handleConfirm() {
    if (!moduloId) return

    const tituloLimpo = titulo.trim()
    if (tituloLimpo.length < 2) {
      setError('Informe o título da aula')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (tipo === 'VIDEO' && fonteVideo === 'arquivo') {
        if (!arquivo) {
          setError('Selecione um arquivo de vídeo')
          return
        }

        const formData = new FormData()
        formData.append('titulo', tituloLimpo)
        formData.append('video', arquivo)

        await apiUpload(`/cursos/admin/modulos/${moduloId}/aulas/video`, formData)
      } else {
        const body: Record<string, string> = {
          titulo: tituloLimpo,
          tipo,
        }

        if (tipo === 'VIDEO' || tipo === 'PDF') {
          if (!conteudoUrl.trim()) {
            setError('Informe a URL do conteúdo')
            return
          }
          body.conteudoUrl = conteudoUrl.trim()
        }

        if (tipo === 'TEXTO') {
          if (!conteudoTexto.trim()) {
            setError('Informe o texto da aula')
            return
          }
          body.conteudoTexto = conteudoTexto.trim()
        }

        await apiFetch(`/cursos/admin/modulos/${moduloId}/aulas`, {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar aula')
    } finally {
      setIsLoading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const confirmDisabled =
    titulo.trim().length < 2 ||
    (tipo === 'VIDEO' && fonteVideo === 'arquivo' && !arquivo) ||
    (tipo === 'VIDEO' && fonteVideo === 'link' && !conteudoUrl.trim()) ||
    (tipo === 'PDF' && !conteudoUrl.trim()) ||
    (tipo === 'TEXTO' && !conteudoTexto.trim())

  return (
    <GlassModal
      isOpen={isOpen}
      title="Nova aula"
      subtitle="Vídeos enviados por arquivo rodam direto na plataforma"
      onClose={onClose}
      footer={
        <GlassModalActions
          onCancel={onClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="Criar aula"
          isLoading={isLoading}
          isConfirmDisabled={confirmDisabled}
        />
      }
    >
      <div className="space-y-4">
        <FormField
          label="Título"
          name="titulo"
          placeholder="Ex.: Boas-vindas"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          autoFocus
        />

        <label className="block text-sm">
          <span className="mb-1.5 block text-zinc-400">Tipo</span>
          <select
            value={tipo}
            onChange={(event) => setTipo(event.target.value as TipoCursoAula)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
          >
            <option value="VIDEO">Vídeo</option>
            <option value="PDF">PDF</option>
            <option value="TEXTO">Texto</option>
          </select>
        </label>

        {tipo === 'VIDEO' ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFonteVideo('arquivo')}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  fonteVideo === 'arquivo'
                    ? 'border-violet-400/40 bg-violet-500/15 text-white'
                    : 'border-white/10 bg-white/5 text-zinc-400'
                }`}
              >
                Enviar arquivo
              </button>
              <button
                type="button"
                onClick={() => setFonteVideo('link')}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  fonteVideo === 'link'
                    ? 'border-violet-400/40 bg-violet-500/15 text-white'
                    : 'border-white/10 bg-white/5 text-zinc-400'
                }`}
              >
                Link externo
              </button>
            </div>

            {fonteVideo === 'arquivo' ? (
              <label className="block">
                <span className="mb-1.5 block text-sm text-zinc-400">
                  Arquivo MP4/WebM (até {getCursoVideoMaxMbLabel()})
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime"
                  onChange={handleArquivoChange}
                  className="block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-500/20 file:px-3 file:py-2 file:text-sm file:text-violet-200"
                />
                {arquivo ? (
                  <p className="mt-2 text-xs text-zinc-500">{arquivo.name}</p>
                ) : null}
              </label>
            ) : (
              <FormField
                label="URL do YouTube, Vimeo ou .mp4"
                name="conteudoUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={conteudoUrl}
                onChange={(event) => setConteudoUrl(event.target.value)}
              />
            )}
          </div>
        ) : null}

        {tipo === 'PDF' ? (
          <FormField
            label="URL do PDF"
            name="conteudoUrl"
            placeholder="https://..."
            value={conteudoUrl}
            onChange={(event) => setConteudoUrl(event.target.value)}
          />
        ) : null}

        {tipo === 'TEXTO' ? (
          <label className="block text-sm">
            <span className="mb-1.5 block text-zinc-400">Conteúdo</span>
            <textarea
              value={conteudoTexto}
              onChange={(event) => setConteudoTexto(event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
            />
          </label>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    </GlassModal>
  )
}
