import { IsOptional, IsString, MinLength } from 'class-validator'

export class VincularMembroDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string

  @IsOptional()
  @IsString()
  @MinLength(4)
  codigo?: string
}
