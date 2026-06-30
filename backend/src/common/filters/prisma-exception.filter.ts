import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { Response } from 'express'

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientRustPanicError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientInitializationError
      | Prisma.PrismaClientRustPanicError,
    host: ArgumentsHost,
  ) {
    const response = host.switchToHttp().getResponse<Response>()

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      const body = new ServiceUnavailableException(
        'Banco de dados indisponível. No dev local, use o host público do MySQL (EasyPanel → Expor) na DATABASE_URL.',
      ).getResponse()

      response.status(HttpStatus.SERVICE_UNAVAILABLE).json(body)
      return
    }

    if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      exception.code === 'P2002'
    ) {
      const body = new ConflictException('Registro já existe no banco').getResponse()
      response.status(HttpStatus.CONFLICT).json(body)
      return
    }

    const body = new ServiceUnavailableException(
      'Erro ao acessar o banco de dados',
    ).getResponse()

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json(body)
  }
}
