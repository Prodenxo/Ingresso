'use client'

import { Button, Card } from '@heroui/react'
import { ImageIcon, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { EventoPoster } from '@/components/ingressos/evento-poster'
import { ApiError, apiUpload } from '@/lib/api-client'
import { getFlyerMaxBytes, getFlyerMaxMbLabel } from '@/lib/flyer-upload-config'
import { resolveMediaUrl } from '@/lib/media-url'

interface EventoFlyerUploadProps {
  eventoId: string
  eventoNome: string
  imagemUrl: string | null
  onUpdated: (imagemUrl: string | null) => void
}

export function EventoFlyerUpload({
  eventoId,
  eventoNome,
  imagemUrl,
  onUpdated,
}: EventoFlyerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const displayUrl = preview ?? resolveMediaUrl(imagemUrl)

  function handleSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setError(null)

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem (JPG, PNG, WebP ou GIF)')
      return
    }

    if (file.size > getFlyerMaxBytes()) {
      setError(`A imagem deve ter no máximo ${getFlyerMaxMbLabel()}`)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    void uploadFile(file)
  }

  async function uploadFile(file: File) {
    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('flyer', file)

    try {
      const result = await apiUpload<{ imagemUrl: string | null }>(
        `/eventos/${eventoId}/flyer`,
        formData,
      )
      onUpdated(result.imagemUrl)
      setPreview(null)
    } catch (err) {
      setPreview(null)
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar imagem')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  async function handleRemove() {
    setIsRemoving(true)
    setError(null)

    try {
      const result = await apiUpload<{ imagemUrl: string | null }>(
        `/eventos/${eventoId}/flyer`,
        null,
        'DELETE',
      )
      onUpdated(result.imagemUrl)
      setPreview(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover imagem')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-5">
      <Card.Header>
        <Card.Title className="text-white">Capa do evento</Card.Title>
        <Card.Description>
          Poster vertical na vitrine (proporção 3:4, JPG/PNG/WebP/GIF — máx.{' '}
          {getFlyerMaxMbLabel()})
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          {displayUrl ? (
            <EventoPoster
              imagemUrl={displayUrl}
              nome={eventoNome}
              size="md"
              className="!h-[140px] !w-[105px]"
            />
          ) : (
            <div className="flex h-[140px] w-[105px] flex-col items-center justify-center rounded-lg border border-dashed border-white/25 bg-white/5 text-zinc-500">
              <ImageIcon className="mb-2 size-6" aria-hidden />
              <p className="px-2 text-center text-xs">Sem capa</p>
            </div>
          )}

          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Prévia na vitrine
            </p>
            <div className="mt-3 flex gap-3">
              {displayUrl ? (
                <EventoPoster
                  imagemUrl={displayUrl}
                  nome={eventoNome}
                  size="sm"
                />
              ) : (
                <div className="flex h-[88px] w-[66px] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/3">
                  <ImageIcon className="size-4 text-zinc-600" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {eventoNome}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Arte pequena à esquerda, detalhes à direita — como na listagem
                  de ingressos.
                </p>
              </div>
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleSelectFile}
        />

        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            size="sm"
            isDisabled={isUploading || isRemoving}
            onPress={() => inputRef.current?.click()}
          >
            <Upload className="size-4" aria-hidden />
            {isUploading
              ? 'Enviando...'
              : displayUrl
                ? 'Trocar capa'
                : 'Importar capa'}
          </Button>
          {imagemUrl ? (
            <Button
              variant="danger"
              size="sm"
              isDisabled={isUploading || isRemoving}
              onPress={() => void handleRemove()}
            >
              <Trash2 className="size-4" aria-hidden />
              {isRemoving ? 'Removendo...' : 'Remover'}
            </Button>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </Card.Content>
    </Card>
  )
}
