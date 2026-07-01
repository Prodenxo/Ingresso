'use client'

import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { ApiError, apiUpload } from '@/lib/api-client'
import {
  getCursoVideoMaxBytes,
  getCursoVideoMaxMbLabel,
} from '@/lib/cursos-video-upload-config'

interface AulaVideoUploadButtonProps {
  aulaId: string
  onUploaded: () => void
}

export function AulaVideoUploadButton({
  aulaId,
  onUploaded,
}: AulaVideoUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setError(null)

    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('Use MP4 ou WebM')
      return
    }

    if (file.size > getCursoVideoMaxBytes()) {
      setError(`Máx. ${getCursoVideoMaxMbLabel()}`)
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('video', file)
      await apiUpload(`/cursos/admin/aulas/${aulaId}/video`, formData)
      onUploaded()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro no upload')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-violet-300 hover:bg-violet-500/10 disabled:opacity-50"
        title={`Enviar vídeo (até ${getCursoVideoMaxMbLabel()})`}
      >
        <Upload className="size-3.5" aria-hidden />
        {isUploading ? 'Enviando...' : 'Enviar MP4'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />
      {error ? <span className="text-[10px] text-red-300">{error}</span> : null}
    </div>
  )
}
