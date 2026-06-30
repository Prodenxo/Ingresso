import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export class CreateLoteDto {
  @IsString()
  @IsNotEmpty()
  nome!: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco!: number

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoDe?: number

  @IsInt()
  @Min(1)
  quantidade!: number

  @IsDateString()
  vendaInicio!: string

  @IsDateString()
  vendaFim!: string

  @IsOptional()
  @IsInt()
  @Min(1)
  limitePorCompra?: number
}
