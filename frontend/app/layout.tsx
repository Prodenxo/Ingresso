import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { getClientApiUrl } from '@/lib/api-proxy-config'
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
  title: 'Onith Eventos | Gestão de Eventos',
  description: 'Plataforma Onith Eventos para gestão de eventos e venda de ingressos',
  icons: {
    icon: '/brand-logo.png',
    apple: '/brand-logo.png',
  },
}

function resolveRuntimeApiUrl(): string {
  return getClientApiUrl()
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
            __html: `window.__ONITH_EVENTOS_API_URL__=${JSON.stringify(runtimeApiUrl)};`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#09090b] text-zinc-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
