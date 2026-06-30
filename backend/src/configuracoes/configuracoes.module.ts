import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { ConfiguracoesPagamentosController } from './configuracoes-pagamentos.controller'
import { ConfiguracoesPagamentosService } from './configuracoes-pagamentos.service'

@Module({
  imports: [AuthModule],
  controllers: [ConfiguracoesPagamentosController],
  providers: [ConfiguracoesPagamentosService, EmpresaAccessService],
  exports: [ConfiguracoesPagamentosService],
})
export class ConfiguracoesModule {}
