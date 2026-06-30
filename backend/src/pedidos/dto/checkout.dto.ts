import { IsInt, Min } from 'class-validator'

export class CheckoutDto {
  @IsInt()
  @Min(1)
  quantidade!: number
}
