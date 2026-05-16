import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSpeciesDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
