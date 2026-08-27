import { Module } from '@nestjs/common'
import { PedidosModule } from '../pedidos/pedidos.module'
import { InfinityPayWebhookController } from './infinitypay-webhook.controller'
import { InterPixWebhookController } from './inter-pix-webhook.controller'

@Module({
  imports: [PedidosModule],
  controllers: [InterPixWebhookController, InfinityPayWebhookController],
})
export class WebhooksModule {}
