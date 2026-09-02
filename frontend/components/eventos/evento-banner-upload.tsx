'use client'

import { Button, Card } from '@heroui/react'
import { ImageIcon, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { ApiError, apiUpload } from '@/lib/api-client'
import { getFlyerMaxBytes, getFlyerMaxMbLabel } from '@/lib/flyer-upload-config'
import { resolveMediaUrl } from '@/lib/media-url'

interface EventoBannerUploadProps {
  eventoId: string
  eventoNome: string
  bannerUrl: string | null
  onUpdated: (bannerUrl: string | null) => void
  onRefresh?: () => void | Promise<void>
}

export function EventoBannerUpload({
  eventoId,
  eventoNome,
  bannerUrl,
  onUpdated,
  onRefresh,
}: EventoBannerUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const displayUrl = preview ?? resolveMediaUrl(bannerUrl)

  function handleSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setError(null)
    setSuccess(null)

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem (JPG, PNG, WebP ou GIF)')
      return
    }

    if (file.size > getFlyerMaxBytes()) {
      setError(`A imagem deve ter no máximo ${getFlyerMaxMbLabel()}`)
      return
    }

    setPreview(URL.createObjectURL(file))
    void uploadFile(file)
  }

  async function uploadFile(file: File) {
    setIsUploading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('banner', file)

    try {
      const result = await apiUpload<{ bannerUrl: string | null }>(
        `/eventos/${eventoId}/banner`,
        formData,
      )

      if (!result.bannerUrl) {
        setError('O banner não ficou salvo. Tente enviar novamente.')
        return
      }

      onUpdated(result.bannerUrl)
      setPreview(null)
      setSuccess('Banner salvo com sucesso.')
      await onRefresh?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar banner')
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    setIsRemoving(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await apiUpload<{ bannerUrl: string | null }>(
        `/eventos/${eventoId}/banner`,
        null,
        'DELETE',
      )
      onUpdated(result.bannerUrl)
      setPreview(null)
      setSuccess('Banner removido.')
      await onRefresh?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover banner')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-5">
      <Card.Header>
        <Card.Title className="text-white">Banner paisagem</Card.Title>
        <Card.Description>
          Imagem horizontal para a página pública do evento (recomendado 1600×838).
          Clique para ampliar sem cortar. JPG/PNG/WebP/GIF, máx. {getFlyerMaxMbLabel()}.
        </Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        {displayUrl ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#050508]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt={`Banner ${eventoNome}`}
              className="mx-auto max-h-48 w-full object-contain sm:max-h-56"
            />
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/25 bg-white/5 text-zinc-500">
            <ImageIcon className="mb-2 size-6" aria-hidden />
            <p className="px-4 text-center text-sm">Nenhum banner paisagem</p>
          </div>
        )}

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
                ? 'Trocar banner'
                : 'Importar banner'}
          </Button>
          {bannerUrl ? (
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

        {success ? (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </Card.Content>
    </Card>
  )
}
