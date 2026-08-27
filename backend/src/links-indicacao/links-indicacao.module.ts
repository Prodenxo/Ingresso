import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { LinksIndicacaoController } from './links-indicacao.controller'
import { LinksIndicacaoService } from './links-indicacao.service'

@Module({
  imports: [AuthModule],
  controllers: [LinksIndicacaoController],
  providers: [LinksIndicacaoService, EmpresaAccessService],
  exports: [LinksIndicacaoService],
})
export class LinksIndicacaoModule {}
