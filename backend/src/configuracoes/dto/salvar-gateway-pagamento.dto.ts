import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator'
import {
  GATEWAY_AMBIENTES,
  GATEWAY_PROVIDERS,
} from '../gateway-pagamento.types'

export class SalvarGatewayPagamentoDto {
  @IsIn(GATEWAY_PROVIDERS)
  provider!: (typeof GATEWAY_PROVIDERS)[number]

  @IsIn(GATEWAY_AMBIENTES)
  ambiente!: (typeof GATEWAY_AMBIENTES)[number]

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clientId?: string

  @ValidateIf((dto: SalvarGatewayPagamentoDto) => dto.clientSecret !== undefined)
  @IsString()
  @IsNotEmpty()
  clientSecret?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  certificadoPem?: string

  @ValidateIf((dto: SalvarGatewayPagamentoDto) => dto.chavePrivadaPem !== undefined)
  @IsString()
  @IsNotEmpty()
  chavePrivadaPem?: string

  @IsOptional()
  @IsString()
  chavePix?: string

  @IsOptional()
  @IsString()
  webhookSecret?: string
}
