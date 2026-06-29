import { Injectable } from '@nestjs/common'

@Injectable()
export class AuthService {
  getStatus() {
    return {
      module: 'auth',
      ready: false,
      message: 'Autenticação JWT será implementada na próxima etapa',
    }
  }
}
