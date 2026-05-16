import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { PetGender } from '../enums/pet-gender.enum';
import { PetAgeGroup } from '../enums/pet-age-group.enum';

export class CreatePetDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  speciesId!: number;

  @IsOptional()
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

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  intakeDate!: string;
}
