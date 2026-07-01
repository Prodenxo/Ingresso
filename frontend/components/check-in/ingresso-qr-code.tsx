'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface IngressoQrCodeProps {
  codigo: string
  size?: number
}

export function IngressoQrCode({ codigo, size = 200 }: IngressoQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    void QRCode.toDataURL(codigo, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    }).then((url) => {
      if (active) {
        setDataUrl(url)
      }
    })

    return () => {
      active = false
    }
  }, [codigo, size])

  if (!dataUrl) {
    return (
      <div
        className="mx-auto animate-pulse rounded-xl bg-white/10"
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code do ingresso ${codigo}`}
      width={size}
      height={size}
      className="mx-auto rounded-xl bg-white p-3 shadow-sm"
    />
  )
}
