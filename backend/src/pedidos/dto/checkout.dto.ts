import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { ParticipanteAdicionalDto } from './participante-adicional.dto'

export const METODOS_CHECKOUT = ['PIX', 'BOLETO'] as const
export type MetodoCheckout = (typeof METODOS_CHECKOUT)[number]

export class CheckoutDto {
  @IsInt()
  @Min(1)
  quantidade!: number

  @IsOptional()
  @IsIn(METODOS_CHECKOUT)
  metodo?: MetodoCheckout

  @ValidateIf((dto: CheckoutDto) => dto.metodo === 'BOLETO')
  @IsString()
  compradorCpf?: string

  @ValidateIf((dto: CheckoutDto) => dto.quantidade > 1)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ParticipanteAdicionalDto)
  participantesAdicionais?: ParticipanteAdicionalDto[]
}
