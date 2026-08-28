import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export class CreateLinkIndicacaoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  nome!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[a-zA-Z0-9\u00C0-\u024F\s-]+$/, {
    message: 'Use apenas letras, números e hífens',
  })
  slug!: string

  @IsUUID()
  loteId!: string

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99.99)
  descontoPercentual!: number
}

export class UpdateLinkIndicacaoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nome?: string

  @IsOptional()
  @IsBoolean()
  ativo?: boolean

  @IsOptional()
  @IsUUID()
  loteId?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99.99)
  descontoPercentual?: number
}
