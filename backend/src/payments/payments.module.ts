import { Module } from '@nestjs/common'
import { InterPixProvider } from './providers/inter-pix.provider'
import { PaymentProviderFactory } from './payment-provider.factory'

@Module({
  providers: [InterPixProvider, PaymentProviderFactory],
  exports: [PaymentProviderFactory, InterPixProvider],
})
export class PaymentsModule {}
