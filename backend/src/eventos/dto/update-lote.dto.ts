import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator'
import { StatusLote } from '@prisma/client'

export class UpdateLoteDto {
  @IsOptional()
  @IsString()
  nome?: string

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco?: number

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoDe?: number | null

  @IsOptional()
  @IsInt()
  @Min(1)
  quantidade?: number

  @IsOptional()
  @IsDateString()
  vendaInicio?: string

  @IsOptional()
  @IsDateString()
  vendaFim?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  limitePorCompra?: number

  @IsOptional()
  @IsEnum([StatusLote.ATIVO, StatusLote.INATIVO])
  status?: StatusLote
}
