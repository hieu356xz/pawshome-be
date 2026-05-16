import { IsOptional, IsString, IsBoolean, IsEmail } from 'class-validator';

export class UpdateAdoptionRequestDto {
  @IsOptional()
  @IsString()
  applicantName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  reason?: string;

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

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
