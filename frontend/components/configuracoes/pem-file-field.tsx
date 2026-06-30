'use client'

import { Button, Label } from '@heroui/react'
import { FileKey2, Upload, X } from 'lucide-react'
import { useRef } from 'react'

type PemFileKind = 'certificate' | 'private-key'

interface PemFileFieldProps {
  id: string
  label: string
  kind: PemFileKind
  required?: boolean
  selectedFileName: string | null
  savedHint?: string
  onLoaded: (content: string, fileName: string) => void
  onClear: () => void
  onError: (message: string) => void
}

const ACCEPT_BY_KIND: Record<PemFileKind, string> = {
  certificate: '.crt,.cer,.pem',
  'private-key': '.key,.pem',
}

function isValidPem(content: string, kind: PemFileKind): boolean {
  if (kind === 'certificate') {
    return content.includes('BEGIN CERTIFICATE')
  }

  return /BEGIN (?:RSA |EC )?PRIVATE KEY/.test(content)
}

export function PemFileField({
  id,
  label,
  kind,
  required = false,
  selectedFileName,
  savedHint,
  onLoaded,
  onClear,
  onError,
}: PemFileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const content = await file.text()

      if (!isValidPem(content, kind)) {
        onError(
          kind === 'certificate'
            ? 'Arquivo inválido. Selecione um certificado .crt ou .pem válido.'
            : 'Arquivo inválido. Selecione uma chave privada .key ou .pem válida.',
        )
        return
      }

      onLoaded(content, file.name)
    } catch {
      onError('Não foi possível ler o arquivo selecionado.')
    } finally {
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </Label>

      <div className="rounded-xl border border-dashed border-white/15 bg-white/3 p-4">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPT_BY_KIND[kind]}
          className="sr-only"
          onChange={(event) => void handleSelectFile(event)}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={() => inputRef.current?.click()}
          >
            <Upload className="size-4" aria-hidden />
            Escolher arquivo
          </Button>

          {selectedFileName ? (
            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-zinc-300">
              <FileKey2 className="size-4 shrink-0 text-indigo-400" aria-hidden />
              <span className="truncate font-mono">{selectedFileName}</span>
              <button
                type="button"
                className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
                aria-label={`Remover arquivo ${selectedFileName}`}
                onClick={onClear}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              {savedHint ?? 'Nenhum arquivo selecionado'}
            </p>
          )}
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          {kind === 'certificate'
            ? 'Formatos: .crt, .cer ou .pem'
            : 'Formatos: .key ou .pem'}
        </p>
      </div>
    </div>
  )
}
