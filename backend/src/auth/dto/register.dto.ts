import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator'

export type RegisterTipo = 'empresa' | 'usuario'

export class RegisterDto {
  @IsIn(['empresa', 'usuario'])
  tipo!: RegisterTipo

  @IsString()
  @IsNotEmpty()
  nome!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  senha!: string

  @IsOptional()
  @IsString()
  telefone?: string

  @ValidateIf((dto: RegisterDto) => dto.tipo === 'empresa')
  @IsString()
  @IsNotEmpty({ message: 'Nome da empresa é obrigatório' })
  nomeEmpresa?: string

  @ValidateIf((dto: RegisterDto) => dto.tipo === 'empresa')
  @IsString()
  @IsNotEmpty({ message: 'Razão social é obrigatória' })
  razaoSocial?: string

  @ValidateIf((dto: RegisterDto) => dto.tipo === 'empresa')
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter 14 dígitos' })
  cnpj?: string
}
