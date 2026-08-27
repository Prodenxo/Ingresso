'use client'

import { Card } from '@heroui/react'
import { Loader2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import { saveLinkIndicacaoSlug } from '@/lib/link-indicacao-storage'
import type { LinkIndicacaoPublico } from '@/types/links-indicacao'

export default function LinkIndicacaoRedirectPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function resolverLink() {
      try {
        const data = await apiFetch<LinkIndicacaoPublico>(
          `/links-indicacao/publico/${params.slug}`,
        )

        saveLinkIndicacaoSlug(data.slug)
        router.replace('/ingressos')
      } catch {
        setError('Link de indicação inválido ou indisponível.')
      }
    }

    void resolverLink()
  }, [params.slug, router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070d] p-6">
        <Card className="glass-panel max-w-md rounded-2xl border-white/10 p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07070d] p-6">
      <div className="flex items-center gap-3 text-zinc-400">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        <p className="text-sm">Redirecionando para os ingressos...</p>
      </div>
    </div>
  )
}
