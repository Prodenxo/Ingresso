'use client'

import { useEffect, useState } from 'react'
import { IngressoQrCode } from '@/components/check-in/ingresso-qr-code'

interface IngressoQrCodeResponsiveProps {
  codigo: string
}

export function IngressoQrCodeResponsive({ codigo }: IngressoQrCodeResponsiveProps) {
  const [size, setSize] = useState(220)

  useEffect(() => {
    function updateSize() {
      setSize(window.innerWidth < 768 ? 240 : 200)
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return <IngressoQrCode codigo={codigo} size={size} />
}
