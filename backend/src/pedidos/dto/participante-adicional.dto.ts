import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class ParticipanteAdicionalDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nome!: string

  @IsString()
  @IsNotEmpty()
  cpf!: string

  @IsString()
  @IsNotEmpty()
  telefone!: string
}
