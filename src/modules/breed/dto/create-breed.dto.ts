import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBreedDto {
  @IsNumber()
  @IsNotEmpty()
  speciesId!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
