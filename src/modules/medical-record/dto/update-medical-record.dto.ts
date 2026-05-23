import {
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

export class UpdateMedicalRecordDto {
  @IsOptional()
  @IsEnum(MedicalRecordType)
  recordType?: MedicalRecordType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  recordDate?: string;

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
