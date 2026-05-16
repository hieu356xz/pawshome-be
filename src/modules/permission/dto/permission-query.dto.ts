import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { SortOrder } from '@common/enums/sort-order.enum';
import { ToLowerCase } from '@/common/decorators/to-lowercase.decorator';

export class PermissionQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @ToLowerCase()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
