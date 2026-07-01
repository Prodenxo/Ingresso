import { Module } from '@nestjs/common'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { CursosAccessService } from './cursos-access.service'
import { CursosController } from './cursos.controller'
import { CursosMediaService } from './cursos-media.service'
import { CursosService } from './cursos.service'

@Module({
  controllers: [CursosController],
  providers: [
    CursosService,
    CursosAccessService,
    CursosMediaService,
    EmpresaAccessService,
  ],
  exports: [CursosAccessService],
})
export class CursosModule {}