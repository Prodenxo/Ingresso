'use client'

import { Button, Card } from '@heroui/react'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface GlassModalProps {
  isOpen: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export function GlassModal({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: GlassModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="glass-modal-title"
      onClick={onClose}
    >
      <Card
        className="glass-panel max-h-[92vh] w-full overflow-y-auto rounded-t-2xl rounded-b-none border-white/10 p-5 sm:max-w-md sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="glass-modal-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        <div>{children}</div>

        {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </Card>
    </div>
  )
}

interface GlassModalActionsProps {
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  isConfirmDisabled?: boolean
}

export function GlassModalActions({
  onCancel,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  isConfirmDisabled = false,
}: GlassModalActionsProps) {
  return (
    <>
      <Button variant="secondary" onPress={onCancel} isDisabled={isLoading}>
        {cancelLabel}
      </Button>
      <Button
        variant="primary"
        onPress={onConfirm}
        isDisabled={isLoading || isConfirmDisabled}
      >
        {confirmLabel}
      </Button>
    </>
  )
}
