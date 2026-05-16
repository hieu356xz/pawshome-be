import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class NumberIdParamDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  id!: number;
}
