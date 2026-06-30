import { Module } from '@nestjs/common'
import { PedidosModule } from '../pedidos/pedidos.module'
import { InterPixWebhookController } from './inter-pix-webhook.controller'

@Module({
  imports: [PedidosModule],
  controllers: [InterPixWebhookController],
})
export class WebhooksModule {}
