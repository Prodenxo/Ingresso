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

  @IsOptional()
  @IsIn(GATEWAY_AMBIENTES)
  ambiente?: (typeof GATEWAY_AMBIENTES)[number]

  /** Inter: Client ID · InfinityPay: InfiniteTag (handle) */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clientId?: string

  @ValidateIf(
    (dto: SalvarGatewayPagamentoDto) =>
      dto.provider === 'inter-pix' && dto.clientSecret !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  clientSecret?: string

  @ValidateIf((dto: SalvarGatewayPagamentoDto) => dto.provider === 'inter-pix')
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  certificadoPem?: string

  @ValidateIf(
    (dto: SalvarGatewayPagamentoDto) =>
      dto.provider === 'inter-pix' && dto.chavePrivadaPem !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  chavePrivadaPem?: string

  @ValidateIf((dto: SalvarGatewayPagamentoDto) => dto.provider === 'inter-pix')
  @IsOptional()
  @IsString()
  chavePix?: string

  @IsOptional()
  @IsString()
  webhookSecret?: string
}
