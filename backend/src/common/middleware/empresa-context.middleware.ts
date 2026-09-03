import { Injectable, NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { runWithEmpresaContext } from '../context/empresa-context'

@Injectable()
export class EmpresaContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const raw = req.headers['x-empresa-id']
    const empresaId =
      typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : undefined

    runWithEmpresaContext(empresaId, () => next())
  }
}
