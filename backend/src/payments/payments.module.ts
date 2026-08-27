import { Module } from '@nestjs/common'
import { InfinityPayProvider } from './providers/infinitypay.provider'
import { InterBoletoProvider } from './providers/inter-boleto.provider'
import { InterPixProvider } from './providers/inter-pix.provider'
import { PaymentProviderFactory } from './payment-provider.factory'

@Module({
  providers: [
    InterPixProvider,
    InterBoletoProvider,
    InfinityPayProvider,
    PaymentProviderFactory,
  ],
  exports: [
    PaymentProviderFactory,
    InterPixProvider,
    InterBoletoProvider,
    InfinityPayProvider,
  ],
})
export class PaymentsModule {}
