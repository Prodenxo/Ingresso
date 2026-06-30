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
