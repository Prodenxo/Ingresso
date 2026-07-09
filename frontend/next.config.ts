import type { NextConfig } from 'next'

// Standalone só no Docker/EasyPanel; na Vercel o preset Next.js usa o output padrão.
const nextConfig: NextConfig = {
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
}

export default nextConfig
