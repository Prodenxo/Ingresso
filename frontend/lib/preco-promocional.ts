import { formatCurrency } from '@/lib/utils'

export interface PrecoPromocional {
  hasPromo: boolean
  precoReal: number
  precoDe: number | null
  textoCompleto: string
}

export function getPrecoPromocional(
  preco: number,
  precoDe?: number | null,
): PrecoPromocional {
  if (precoDe && precoDe > preco) {
    return {
      hasPromo: true,
      precoReal: preco,
      precoDe,
      textoCompleto: `De ${formatCurrency(precoDe)} por ${formatCurrency(preco)}`,
    }
  }

  return {
    hasPromo: false,
    precoReal: preco,
    precoDe: null,
    textoCompleto: formatCurrency(preco),
  }
}

/** Desconto percentual sobre o preço âncora: (De − Por) / De × 100 */
export function calcDescontoPercentual(
  preco: number,
  precoDe: number,
): number | null {
  if (!Number.isFinite(preco) || !Number.isFinite(precoDe)) return null
  if (precoDe <= preco || preco <= 0) return null

  const percentual = ((precoDe - preco) / precoDe) * 100
  return Math.round(percentual * 10) / 10
}

/** Preço âncora a partir do valor final e do desconto percentual */
export function calcPrecoDeFromDesconto(
  preco: number,
  descontoPercentual: number,
): number | null {
  if (!Number.isFinite(preco) || preco <= 0) return null
  if (descontoPercentual <= 0 || descontoPercentual >= 100) return null

  const precoDe = preco / (1 - descontoPercentual / 100)
  return Math.round(precoDe * 100) / 100
}

export function parsePercentual(
  value: number | string | null | undefined,
): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatDescontoPercentual(
  percentual: number | string | null | undefined,
): string {
  const value = parsePercentual(percentual)

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace(/\.0$/, '')
}
