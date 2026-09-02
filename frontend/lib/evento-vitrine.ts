export const EVENTO_DESCRICAO_MAX_PALAVRAS = 1300

export function contarPalavras(texto: string): number {
  const normalizado = texto.trim()
  if (!normalizado) return 0
  return normalizado.split(/\s+/).length
}

export function validarDescricaoVitrine(descricao: string): string | null {
  const trim = descricao.trim()
  if (!trim) return null

  const palavras = contarPalavras(trim)
  if (palavras > EVENTO_DESCRICAO_MAX_PALAVRAS) {
    return `A descrição deve ter no máximo ${EVENTO_DESCRICAO_MAX_PALAVRAS} palavras (atual: ${palavras})`
  }

  if (palavras > 0 && trim.length < 20) {
    return 'A descrição de venda deve ter pelo menos 20 caracteres ou ficar vazia'
  }

  return null
}
