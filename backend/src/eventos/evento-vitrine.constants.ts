import { BadRequestException } from '@nestjs/common'

export const EVENTO_DESCRICAO_MAX_PALAVRAS = 1300

export function contarPalavras(texto: string): number {
  const normalizado = texto.trim()
  if (!normalizado) return 0
  return normalizado.split(/\s+/).length
}

export function validarDescricaoVitrine(descricao: string | undefined): string | undefined {
  if (descricao === undefined) return undefined

  const trim = descricao.trim()
  if (!trim) return ''

  const palavras = contarPalavras(trim)
  if (palavras > EVENTO_DESCRICAO_MAX_PALAVRAS) {
    throw new BadRequestException(
      `A descrição de venda deve ter no máximo ${EVENTO_DESCRICAO_MAX_PALAVRAS} palavras (atual: ${palavras})`,
    )
  }

  return trim
}
