declare global {
  interface Window {
    __EVENTHUB_API_URL__?: string
  }
}

const LOCAL_API_URL = 'http://127.0.0.1:3001/api'

function normalizeApiUrl(value: string): string {
  return value.trim().replace(/\/$/, '')
}

export function getApiUrl(): string {
  if (typeof window !== 'undefined' && window.__EVENTHUB_API_URL__) {
    return normalizeApiUrl(window.__EVENTHUB_API_URL__)
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_URL

  if (fromEnv && fromEnv.trim()) {
    return normalizeApiUrl(fromEnv)
  }

  return LOCAL_API_URL
}

export function getNetworkErrorMessage(): string {
  const apiUrl = getApiUrl()

  if (apiUrl.includes('127.0.0.1') || apiUrl.includes('localhost')) {
    return 'Servidor indisponível. Inicie o backend com npm run dev:api'
  }

  return 'Não foi possível conectar ao servidor. Tente novamente em instantes.'
}
