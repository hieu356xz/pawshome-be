import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';

export class PetImageQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  petId?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
