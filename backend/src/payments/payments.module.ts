import { Module } from '@nestjs/common'
import { InterBoletoProvider } from './providers/inter-boleto.provider'
import { InterPixProvider } from './providers/inter-pix.provider'
import { PaymentProviderFactory } from './payment-provider.factory'

@Module({
  providers: [InterPixProvider, InterBoletoProvider, PaymentProviderFactory],
  exports: [PaymentProviderFactory, InterPixProvider, InterBoletoProvider],
})
export class PaymentsModule {}
