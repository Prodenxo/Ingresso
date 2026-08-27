import { Injectable } from '@nestjs/common'

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'ok',
      service: 'onith-eventos-api',
      timestamp: new Date().toISOString(),
    }
  }
}
