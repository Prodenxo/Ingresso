import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { LinksIndicacaoModule } from '../links-indicacao/links-indicacao.module'
import { PaymentsModule } from '../payments/payments.module'
import { PedidosController } from './pedidos.controller'
import { PedidosService } from './pedidos.service'

@Module({
  imports: [AuthModule, ConfiguracoesModule, PaymentsModule, LinksIndicacaoModule],
  controllers: [PedidosController],
  providers: [PedidosService, EmpresaAccessService],
  exports: [PedidosService],
})
export class PedidosModule {}
