import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { MembrosController } from './membros.controller'
import { MembrosService } from './membros.service'

@Module({
  imports: [AuthModule],
  controllers: [MembrosController],
  providers: [MembrosService, EmpresaAccessService],
  exports: [MembrosService],
})
export class MembrosModule {}
