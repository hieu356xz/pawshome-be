import {
  IsBoolean,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { PetGender } from '../enums/pet-gender.enum';
import { PetAgeGroup } from '../enums/pet-age-group.enum';
import { AdoptionStatus } from '../enums/adoption-status.enum';

export class UpdatePetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  speciesId?: number;

  @IsOptional()
  @IsNumber()
  breedId?: number | null;

  @IsOptional()
  @IsEnum(PetGender)
  gender?: PetGender;

  @IsOptional()
  @IsEnum(PetAgeGroup)
  ageGroup?: PetAgeGroup;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  weight?: number | null;

  @IsOptional()
  @IsEnum(AdoptionStatus)
  adoptionStatus?: AdoptionStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isVaccinated?: boolean;

  @IsOptional()
  @IsBoolean()
  isNeutered?: boolean;

  @IsOptional()
  @IsString()
  healthSummary?: string;

  @IsOptional()
  @IsDateString()
  intakeDate?: string;

  @IsOptional()
  @IsString()
  petCode?: string;
}
