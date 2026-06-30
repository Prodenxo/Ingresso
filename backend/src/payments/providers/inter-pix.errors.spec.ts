import { mapInterHttpError, mapInterNetworkError } from './inter-pix.errors'

describe('inter-pix.errors', () => {
  describe('mapInterHttpError', () => {
    it('mapeia 401 para mensagem de credenciais', () => {
      expect(
        mapInterHttpError(401, { error_description: 'invalid_client' }, ''),
      ).toBe('Credenciais inválidas: invalid_client')
    })

    it('mapeia 403 para mensagem de permissão', () => {
      expect(mapInterHttpError(403, {}, '')).toBe(
        'Integração sem permissão para os escopos Pix. Verifique as permissões no portal Inter',
      )
    })

    it('usa detail quando disponível', () => {
      expect(mapInterHttpError(400, { detail: 'Scope inválido' }, '')).toBe(
        'Scope inválido',
      )
    })
  })

  describe('mapInterNetworkError', () => {
    it('mapeia erro de certificado', () => {
      expect(
        mapInterNetworkError(new Error('unable to verify the first certificate')),
      ).toBe(
        'Certificado ou chave privada inválidos. Confira se os arquivos .crt e .key correspondem à integração',
      )
    })

    it('mapeia timeout', () => {
      expect(mapInterNetworkError(new Error('Tempo esgotado'))).toBe(
        'Tempo esgotado ao conectar com o Banco Inter',
      )
    })
  })
})
