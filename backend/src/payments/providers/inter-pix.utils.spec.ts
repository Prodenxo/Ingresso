import { gerarTxidInter } from './inter-pix.utils'

describe('gerarTxidInter', () => {
  it('remove hifens do uuid e mantém 32 caracteres', () => {
    const txid = gerarTxidInter('a1b2c3d4-e5f6-7890-abcd-ef1234567890')

    expect(txid).toBe('a1b2c3d4e5f67890abcdef1234567890')
    expect(txid.length).toBeGreaterThanOrEqual(26)
    expect(txid.length).toBeLessThanOrEqual(35)
  })
})
