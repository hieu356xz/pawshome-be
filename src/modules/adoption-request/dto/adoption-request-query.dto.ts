import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { AdoptionRequestStatus } from '../enums/adoption-request-status.enum';

export class AdoptionRequestQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  petId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(AdoptionRequestStatus)
  status?: AdoptionRequestStatus;
}
