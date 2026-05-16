import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { MedicalRecordType } from '../enums/medical-record-type.enum';

export class MedicalRecordQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  petId?: string;

  @IsOptional()
  @IsEnum(MedicalRecordType)
  recordType?: MedicalRecordType;
}
