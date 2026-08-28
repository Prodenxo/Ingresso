import { IsNotEmpty, IsString } from 'class-validator'

export class VincularLinkIndicacaoDto {
  @IsString()
  @IsNotEmpty()
  slug!: string
}
