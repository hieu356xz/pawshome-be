import { IsOptional, IsString } from 'class-validator';

export class UpdateSpeciesDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
