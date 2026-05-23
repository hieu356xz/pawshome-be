import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { MedicalRecordType } from '../enums/medical-record-type.enum';
import { Currency } from '../enums/currency.enum';
import { Type } from 'class-transformer';

export class CreateMedicalRecordDto {
  @IsEnum(MedicalRecordType)
  recordType!: MedicalRecordType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsDateString()
  recordDate!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsUUID()
  veterinarianId?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  treatment?: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
