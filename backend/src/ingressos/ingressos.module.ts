import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { IngressosController } from './ingressos.controller'
import { IngressosService } from './ingressos.service'

@Module({
  imports: [AuthModule],
  controllers: [IngressosController],
  providers: [IngressosService, EmpresaAccessService],
  exports: [IngressosService],
})
export class IngressosModule {}
