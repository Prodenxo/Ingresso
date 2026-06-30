import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { FormatoEvento } from '@prisma/client'

export class CreateEventoDto {
  @IsString()
  @IsNotEmpty()
  nome!: string

  @IsOptional()
  @IsString()
  descricao?: string

  @IsDateString()
  dataInicio!: string

  @IsOptional()
  @IsDateString()
  dataFim?: string

  @IsOptional()
  @IsString()
  cidade?: string

  @IsOptional()
  @IsString()
  estado?: string

  @IsOptional()
  @IsString()
  endereco?: string

  @IsOptional()
  @IsEnum(FormatoEvento)
  formato?: FormatoEvento

  @IsOptional()
  @IsInt()
  @Min(0)
  capacidade?: number
}
