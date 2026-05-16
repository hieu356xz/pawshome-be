import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PetGender } from '../enums/pet-gender.enum';
import { PetAgeGroup } from '../enums/pet-age-group.enum';
import { AdoptionStatus } from '../enums/adoption-status.enum';

export class PetSearchDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  speciesId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  breedId?: number;

  @IsOptional()
  @IsEnum(PetGender)
  gender?: PetGender;

  @IsOptional()
  @IsEnum(PetAgeGroup)
  ageGroup?: PetAgeGroup;

  @IsOptional()
  @IsEnum(AdoptionStatus)
  adoptionStatus?: AdoptionStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}
