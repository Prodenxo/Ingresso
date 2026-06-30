export interface InterOAuthTokenResponse {
  access_token?: string
  token_type?: string
  expires_in?: number
  scope?: string
}

export interface InterCobResponse {
  txid?: string
  status?: string
  pixCopiaECola?: string
  pixCopiaCola?: string
  location?: string
  loc?: {
    id?: number
    location?: string
  }
}

export interface InterPixWebhookItem {
  endToEndId?: string
  txid?: string
  valor?: string
  horario?: string
}

export interface InterPixWebhookPayload {
  pix?: InterPixWebhookItem[]
}
