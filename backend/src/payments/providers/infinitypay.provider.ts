import { Injectable, Logger } from '@nestjs/common'
import type { InfinityPayGatewayCredenciais } from '../../configuracoes/gateway-pagamento.types'
import type { PaymentConnectionResult } from '../payment-provider.interface'
import {
  INFINITYPAY_API_BASE,
  type CreateInfinityPayLinkParams,
  type InfinityPayCheckoutLinkResult,
  type InfinityPayPaymentCheckParams,
  type InfinityPayPaymentStatus,
  type InfinityPayWebhookPayload,
} from './infinitypay.types'

function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^\$+/, '')
}

function readStringField(
  payload: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = payload[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function readNumberField(
  payload: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const value = payload[key]

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }

  return null
}

@Injectable()
export class InfinityPayProvider {
  private readonly logger = new Logger(InfinityPayProvider.name)

  async testConnection(
    creds: InfinityPayGatewayCredenciais,
    empresaId: string,
  ): Promise<PaymentConnectionResult> {
    const handle = normalizeHandle(creds.handle)

    if (!handle) {
      return {
        ok: false,
        message: 'InfiniteTag (handle) é obrigatório',
      }
    }

    try {
      const result = await this.createCheckoutLink({
        handle,
        orderNsu: `test-${Date.now()}`,
        redirectUrl: this.buildRedirectUrl('test'),
        webhookUrl: this.buildWebhookUrl(empresaId),
        items: [
          {
            quantity: 1,
            price: 100,
            description: 'Teste de conexão Onith Eventos',
          },
        ],
      })

      return {
        ok: Boolean(result.checkoutUrl),
        message: result.checkoutUrl
          ? 'Checkout InfinitePay validado com sucesso'
          : 'InfinitePay não retornou URL de checkout',
        pixHabilitado: true,
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao validar InfinitePay'

      this.logger.warn(`Teste InfinitePay falhou: ${message}`)

      return {
        ok: false,
        message,
      }
    }
  }

  async createCheckoutLink(
    params: CreateInfinityPayLinkParams,
  ): Promise<InfinityPayCheckoutLinkResult> {
    const handle = normalizeHandle(params.handle)

    const response = await fetch(`${INFINITYPAY_API_BASE}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        handle,
        redirect_url: params.redirectUrl,
        webhook_url: params.webhookUrl,
        order_nsu: params.orderNsu,
        items: params.items,
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >

    if (!response.ok) {
      const message =
        readStringField(payload, 'message', 'error', 'detail') ??
        `InfinitePay retornou HTTP ${response.status}`

      throw new Error(message)
    }

    const checkoutUrl =
      readStringField(payload, 'url', 'checkout_url', 'checkoutUrl', 'link') ??
      readStringField(
        (payload.data as Record<string, unknown> | undefined) ?? {},
        'url',
        'checkout_url',
        'checkoutUrl',
        'link',
      )

    if (!checkoutUrl) {
      throw new Error('InfinitePay não retornou URL de checkout')
    }

    const invoiceSlug =
      readStringField(payload, 'invoice_slug', 'invoiceSlug', 'slug') ??
      readStringField(
        (payload.data as Record<string, unknown> | undefined) ?? {},
        'invoice_slug',
        'invoiceSlug',
        'slug',
      )

    return {
      checkoutUrl,
      invoiceSlug,
    }
  }

  async checkPaymentStatus(
    params: InfinityPayPaymentCheckParams,
  ): Promise<InfinityPayPaymentStatus> {
    const handle = normalizeHandle(params.handle)

    const response = await fetch(`${INFINITYPAY_API_BASE}/payment_check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        handle,
        order_nsu: params.orderNsu,
        slug: params.invoiceSlug ?? undefined,
        transaction_nsu: params.transactionNsu ?? undefined,
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >

    if (!response.ok) {
      return {
        pago: false,
        captureMethod: null,
        paidAmount: null,
        transactionNsu: null,
      }
    }

    const paidAmount = readNumberField(payload, 'paid_amount', 'paidAmount')
    const captureRaw = readStringField(payload, 'capture_method', 'captureMethod')
    const transactionNsu = readStringField(
      payload,
      'transaction_nsu',
      'transactionNsu',
    )

    const captureMethod =
      captureRaw === 'pix' || captureRaw === 'credit_card' ? captureRaw : null

    const pago = paidAmount != null && paidAmount > 0

    return {
      pago,
      captureMethod,
      paidAmount,
      transactionNsu,
    }
  }

  extractWebhookOrderNsu(payload: InfinityPayWebhookPayload): string | null {
    return payload.order_nsu ?? payload.orderNsu ?? null
  }

  buildRedirectUrl(pedidoId: string): string {
    const frontendUrl = (
      process.env.FRONTEND_URL ?? 'http://127.0.0.1:3000'
    )
      .trim()
      .replace(/\/$/, '')

    return `${frontendUrl}/ingressos/meus?pedido=${encodeURIComponent(pedidoId)}`
  }

  buildWebhookUrl(empresaId: string): string {
    const backendUrl = (
      process.env.BACKEND_PUBLIC_URL ??
      process.env.API_PUBLIC_URL ??
      `http://127.0.0.1:${process.env.PORT ?? 3001}`
    )
      .trim()
      .replace(/\/$/, '')

    const prefix = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`

    return `${prefix}/webhooks/infinitypay/${empresaId}`
  }
}
