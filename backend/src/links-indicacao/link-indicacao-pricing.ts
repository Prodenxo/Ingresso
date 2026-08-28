export function aplicarDescontoIndicacao(
  preco: number,
  descontoPercentual: number | null | undefined,
): number {
  if (
    descontoPercentual === null ||
    descontoPercentual === undefined ||
    descontoPercentual <= 0
  ) {
    return preco
  }

  const fator = 1 - Number(descontoPercentual) / 100
  return Math.round(preco * fator * 100) / 100
}
