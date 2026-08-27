export const INFINITYPAY_API_BASE = 'https://api.checkout.infinitepay.io'

export interface InfinityPayCheckoutItem {
  quantity: number
  price: number
  description: string
}

export interface CreateInfinityPayLinkParams {
  handle: string
  orderNsu: string
  redirectUrl: string
  webhookUrl: string
  items: InfinityPayCheckoutItem[]
}

export interface InfinityPayCheckoutLinkResult {
  checkoutUrl: string
  invoiceSlug: string | null
}

export interface InfinityPayPaymentCheckParams {
  handle: string
  orderNsu: string
  invoiceSlug: string | null
  transactionNsu?: string | null
}

export interface InfinityPayPaymentStatus {
  pago: boolean
  captureMethod: 'pix' | 'credit_card' | null
  paidAmount: number | null
  transactionNsu: string | null
}

export interface InfinityPayWebhookPayload {
  order_nsu?: string
  orderNsu?: string
  invoice_slug?: string
  invoiceSlug?: string
  transaction_nsu?: string
  transactionNsu?: string
  paid_amount?: number
  paidAmount?: number
  capture_method?: string
  captureMethod?: string
}
