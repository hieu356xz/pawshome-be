import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { PetGender } from '../enums/pet-gender.enum';
import { PetAgeGroup } from '../enums/pet-age-group.enum';
import { AdoptionStatus } from '../enums/adoption-status.enum';
import { Type } from 'class-transformer';

export class CreatePetDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  speciesId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  breedId?: number;

  @IsEnum(PetGender)
  gender!: PetGender;

  @IsEnum(PetAgeGroup)
  ageGroup!: PetAgeGroup;

  @IsString()
  @IsNotEmpty()
  color!: string;

  @IsOptional()
  weight?: number;

  @IsEnum(AdoptionStatus)
  adoptionStatus!: AdoptionStatus;

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

  @IsDateString()
  intakeDate!: string;

  @IsOptional()
  @IsString()
  petCode?: string;
}
