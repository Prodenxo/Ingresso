'use client'

import { useEffect, useRef, useState } from 'react'

interface CheckInScannerProps {
  active: boolean
  onScan: (codigo: string) => void
}

export function CheckInScanner({ active, onScan }: CheckInScannerProps) {
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const lastScanRef = useRef<{ codigo: string; at: number } | null>(null)
  const onScanRef = useRef(onScan)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!active) {
      setCameraError(null)
      return
    }

    let cancelled = false
    const containerId = 'check-in-scanner'

    async function startScanner() {
      setCameraError(null)

      const { Html5Qrcode } = await import('html5-qrcode')

      if (cancelled) {
        return
      }

      const scanner = new Html5Qrcode(containerId, { verbose: false })
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.75
            return { width: size, height: size }
          },
        },
        (decodedText) => {
          const codigo = decodedText.trim().toUpperCase()
          const agora = Date.now()
          const ultimo = lastScanRef.current

          if (ultimo && ultimo.codigo === codigo && agora - ultimo.at < 2500) {
            return
          }

          lastScanRef.current = { codigo, at: agora }
          onScanRef.current(codigo)
        },
        () => {
          // frame sem QR detectado
        },
      )
    }

    void startScanner().catch((err: unknown) => {
      if (cancelled) {
        return
      }

      const message =
        err instanceof Error ? err.message : 'Não foi possível acessar a câmera'

      setCameraError(
        message.includes('NotAllowed')
          ? 'Permita o acesso à câmera nas configurações do navegador.'
          : 'Não foi possível abrir a câmera. Use "Digitar código manualmente".',
      )
    })

    return () => {
      cancelled = true

      void scannerRef.current?.stop().catch(() => undefined)
      scannerRef.current = null
    }
  }, [active])

  return (
    <div className="space-y-2">
      {cameraError ? (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {cameraError}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <div
          id="check-in-scanner"
          className="min-h-[300px] w-full [&_video]:rounded-2xl"
        />
      </div>

      {!cameraError ? (
        <p className="text-center text-xs text-zinc-500">
          Aponte a câmera para o QR Code na tela do participante
        </p>
      ) : null}
    </div>
  )
}
