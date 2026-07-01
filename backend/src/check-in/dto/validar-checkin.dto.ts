import { IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class ValidarCheckinDto {
  @IsString()
  @IsNotEmpty()
  codigo!: string

  @IsUUID()
  eventoId!: string
}
