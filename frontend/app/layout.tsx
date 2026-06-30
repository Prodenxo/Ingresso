import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'EventHub — Gestão de Eventos',
  description: 'Plataforma SaaS de gestão de eventos e venda de ingressos',
}

function resolveRuntimeApiUrl(): string {
  const fromRuntime = process.env.API_URL?.trim()
  const fromPublic = process.env.NEXT_PUBLIC_API_URL?.trim()
  const value = fromRuntime || fromPublic || 'http://127.0.0.1:3001/api'

  return value.replace(/\/$/, '')
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const runtimeApiUrl = resolveRuntimeApiUrl()

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__EVENTHUB_API_URL__=${JSON.stringify(runtimeApiUrl)};`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#09090b] text-zinc-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
