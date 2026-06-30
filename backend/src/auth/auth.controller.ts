import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { CurrentUser } from './decorators/current-user.decorator'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import type {
  AuthTokensResponse,
  AuthUserResponse,
} from './types/auth-response.type'
import type { AuthenticatedUser } from './types/jwt-payload.type'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  status() {
    return this.authService.getStatus()
  }

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthTokensResponse> {
    return this.authService.register(dto)
  }

  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthTokensResponse> {
    return this.authService.login(dto)
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensResponse> {
    return this.authService.refresh(dto.refreshToken)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserResponse> {
    return this.authService.getMe(user.id)
  }
}
