'use client'

import { useEffect, useRef } from 'react'

interface CheckInScannerProps {
  active: boolean
  onScan: (codigo: string) => void
}

export function CheckInScanner({ active, onScan }: CheckInScannerProps) {
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null)
  const lastScanRef = useRef<{ codigo: string; at: number } | null>(null)

  useEffect(() => {
    if (!active) {
      return
    }

    let cancelled = false

    async function startScanner() {
      const containerId = 'check-in-scanner'
      const { Html5Qrcode } = await import('html5-qrcode')

      if (cancelled) {
        return
      }

      const scanner = new Html5Qrcode(containerId, { verbose: false })
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          const codigo = decodedText.trim().toUpperCase()
          const agora = Date.now()
          const ultimo = lastScanRef.current

          if (ultimo && ultimo.codigo === codigo && agora - ultimo.at < 2500) {
            return
          }

          lastScanRef.current = { codigo, at: agora }
          onScan(codigo)
        },
        () => {
          // leitura em andamento, sem match
        },
      )
    }

    void startScanner().catch(() => {
      // câmera indisponível — operador pode digitar o código manualmente
    })

    return () => {
      cancelled = true

      void scannerRef.current?.stop().catch(() => undefined)
      scannerRef.current = null
    }
  }, [active, onScan])

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <div
        id="check-in-scanner"
        className="min-h-[280px] w-full [&_video]:rounded-2xl"
      />
    </div>
  )
}
