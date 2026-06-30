import { BadRequestException, Injectable } from '@nestjs/common'
import type { GatewayProvider } from '../configuracoes/gateway-pagamento.types'
import type { PaymentProvider } from './payment-provider.interface'
import { InterPixProvider } from './providers/inter-pix.provider'

@Injectable()
export class PaymentProviderFactory {
  constructor(private readonly interPixProvider: InterPixProvider) {}

  get(provider: GatewayProvider): PaymentProvider {
    if (provider === 'inter-pix') {
      return this.interPixProvider
    }

    throw new BadRequestException(`Provider "${provider}" não suportado`)
  }
}
