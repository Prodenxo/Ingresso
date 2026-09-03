import type { NextConfig } from 'next'

function getUploadsProxyTarget(): string | undefined {
  const target =
    process.env.API_PROXY_TARGET?.trim() ||
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim()

  if (!target) {
    return undefined
  }

  return target.replace(/\/$/, '')
}

// Standalone só no Docker/EasyPanel; na Vercel o preset Next.js usa o output padrão.
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  async rewrites() {
    const target = getUploadsProxyTarget()

    if (!target) {
      return []
    }

    return [
      {
        source: '/api/uploads/:path*',
        destination: `${target}/uploads/:path*`,
      },
    ]
  },
}

export default nextConfig
