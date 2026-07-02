import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export class ValidarCheckinDto {
  @IsString()
  @IsNotEmpty()
  codigo!: string

  @IsUUID()
  eventoId!: string

  @IsOptional()
  @IsInt()
  @Min(1)
  diaEvento?: number

  @IsOptional()
  @IsUUID()
  pontoCheckinId?: string
}
