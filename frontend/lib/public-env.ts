import { getClientApiUrl } from '@/lib/api-proxy-config'

declare global {
  interface Window {
    __EVENTHUB_API_URL__?: string
  }
}

export function getApiUrl(): string {
  if (typeof window !== 'undefined' && window.__EVENTHUB_API_URL__) {
    return window.__EVENTHUB_API_URL__.trim().replace(/\/$/, '')
  }

  return getClientApiUrl()
}

export function getNetworkErrorMessage(): string {
  const apiUrl = getApiUrl()

  if (apiUrl.startsWith('/')) {
    return 'Não foi possível conectar ao servidor. Tente novamente em instantes.'
  }

  if (apiUrl.includes('127.0.0.1') || apiUrl.includes('localhost')) {
    return 'Servidor indisponível. Inicie o backend com npm run dev:api'
  }

  return 'Não foi possível conectar ao servidor. Tente novamente em instantes.'
}
