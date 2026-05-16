import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsEmail,
} from 'class-validator';

export class CreateAdoptionRequestDto {
  @IsString()
  @IsNotEmpty()
  applicantName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsBoolean()
  hasOtherPets?: boolean;

  @IsOptional()
  @IsString()
  otherPetsDetail?: string;

  @IsOptional()
  @IsString()
  livingSituation?: string;

  @IsOptional()
  @IsBoolean()
  hasYard?: boolean;

  @IsOptional()
  @IsString()
  commitment?: string;
}
