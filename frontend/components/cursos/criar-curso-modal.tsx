'use client'

import { useEffect, useState } from 'react'
import { FormField } from '@/components/ui/form-field'
import { GlassModal, GlassModalActions } from '@/components/ui/glass-modal'

interface CriarCursoModalProps {
  isOpen: boolean
  isLoading?: boolean
  error?: string | null
  onClose: () => void
  onConfirm: (titulo: string) => void
}

export function CriarCursoModal({
  isOpen,
  isLoading = false,
  error = null,
  onClose,
  onConfirm,
}: CriarCursoModalProps) {
  const [titulo, setTitulo] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setTitulo('')
    }
  }, [isOpen])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const valor = titulo.trim()
    if (!valor) return

    onConfirm(valor)
  }

  return (
    <GlassModal
      isOpen={isOpen}
      title="Novo curso"
      subtitle="Dê um nome para começar a montar módulos e aulas"
      onClose={onClose}
      footer={
        <GlassModalActions
          onCancel={onClose}
          onConfirm={() => onConfirm(titulo.trim())}
          confirmLabel="Criar curso"
          isLoading={isLoading}
          isConfirmDisabled={!titulo.trim()}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Título do curso"
          name="titulo"
          placeholder="Ex.: Onboarding da equipe"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          autoComplete="off"
          autoFocus
        />

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </form>
    </GlassModal>
  )
}
