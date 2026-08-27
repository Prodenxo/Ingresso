import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
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
}
