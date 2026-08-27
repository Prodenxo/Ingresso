import type { EmpresaGatewayPagamento } from '@prisma/client'

export type FormaPagamentoDisponivel = 'PIX' | 'BOLETO' | 'CHECKOUT'

export function isMockPixEnabled(): boolean {
  return process.env.MOCK_PIX === 'true'
}

export function isMockBoletoEnabled(): boolean {
  return process.env.MOCK_BOLETO === 'true'
}

export function isMockInfinityPayEnabled(): boolean {
  return process.env.MOCK_INFINITYPAY === 'true'
}

export function isInterGatewayConfigured(
  gatewayConfig: EmpresaGatewayPagamento | null,
): boolean {
  if (!gatewayConfig || gatewayConfig.provider !== 'inter-pix') {
    return false
  }

  return (
    Boolean(gatewayConfig.clientIdEnc) &&
    Boolean(gatewayConfig.clientSecretEnc) &&
    Boolean(gatewayConfig.certificadoEnc) &&
    Boolean(gatewayConfig.chavePrivadaEnc)
  )
}

export function isInterPixReady(
  gatewayConfig: EmpresaGatewayPagamento | null,
): boolean {
  return (
    isInterGatewayConfigured(gatewayConfig) &&
    Boolean(gatewayConfig?.chavePix?.trim())
  )
}

export function isInfinityPayConfigured(
  gatewayConfig: EmpresaGatewayPagamento | null,
): boolean {
  return (
    gatewayConfig?.provider === 'infinitypay' &&
    Boolean(gatewayConfig.clientIdEnc)
  )
}

export function resolverFormasPagamento(
  gatewayConfig: EmpresaGatewayPagamento | null,
): FormaPagamentoDisponivel[] {
  if (isInfinityPayConfigured(gatewayConfig) || isMockInfinityPayEnabled()) {
    return ['CHECKOUT']
  }

  const formas: FormaPagamentoDisponivel[] = []

  if (isMockPixEnabled() || isInterPixReady(gatewayConfig)) {
    formas.push('PIX')
  }

  if (isMockBoletoEnabled() || isInterGatewayConfigured(gatewayConfig)) {
    formas.push('BOLETO')
  }

  return formas
}
