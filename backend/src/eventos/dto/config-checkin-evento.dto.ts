import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'

export class PontoCheckinDto {
  @IsString()
  @IsNotEmpty()
  nome!: string

  @IsInt()
  @Min(1)
  ordem!: number
}

export class ConfigCheckinEventoDto {
  @IsBoolean()
  batePonto!: boolean

  @IsInt()
  @Min(1)
  @Max(30)
  dias!: number

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PontoCheckinDto)
  pontos!: PontoCheckinDto[]
}
