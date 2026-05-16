import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBreedDto {
  @IsOptional()
  @IsNumber()
  speciesId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
