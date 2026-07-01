import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator'
import { StatusCurso, TipoCursoAula } from '@prisma/client'

export class CriarCursoDto {
  @IsString()
  @MinLength(2)
  titulo!: string

  @IsOptional()
  @IsString()
  descricao?: string

  @IsOptional()
  @IsUrl({}, { message: 'capaUrl deve ser uma URL válida' })
  capaUrl?: string

  @IsOptional()
  @IsEnum(StatusCurso)
  status?: StatusCurso

  @IsOptional()
  @IsInt()
  ordem?: number
}

export class AtualizarCursoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  titulo?: string

  @IsOptional()
  @IsString()
  descricao?: string

  @IsOptional()
  @IsUrl({}, { message: 'capaUrl deve ser uma URL válida' })
  capaUrl?: string

  @IsOptional()
  @IsEnum(StatusCurso)
  status?: StatusCurso

  @IsOptional()
  @IsInt()
  ordem?: number
}

export class CriarModuloDto {
  @IsString()
  @MinLength(2)
  titulo!: string

  @IsOptional()
  @IsInt()
  ordem?: number
}

export class AtualizarModuloDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  titulo?: string

  @IsOptional()
  @IsInt()
  ordem?: number
}

export class CriarAulaDto {
  @IsString()
  @MinLength(2)
  titulo!: string

  @IsEnum(TipoCursoAula)
  tipo!: TipoCursoAula

  @IsOptional()
  @IsString()
  conteudoUrl?: string

  @IsOptional()
  @IsString()
  conteudoTexto?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  duracaoMinutos?: number

  @IsOptional()
  @IsInt()
  ordem?: number
}

export class AtualizarAulaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  titulo?: string

  @IsOptional()
  @IsEnum(TipoCursoAula)
  tipo?: TipoCursoAula

  @IsOptional()
  @IsString()
  conteudoUrl?: string

  @IsOptional()
  @IsString()
  conteudoTexto?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  duracaoMinutos?: number

  @IsOptional()
  @IsInt()
  ordem?: number
}

export class SalvarPermissoesCursoDto {
  @IsBoolean()
  acessoCursos!: boolean

  @IsArray()
  @IsString({ each: true })
  cursoIds!: string[]
}

export class RegistrarProgressoAulaDto {
  @IsOptional()
  @IsBoolean()
  concluida?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressoPct?: number
}
