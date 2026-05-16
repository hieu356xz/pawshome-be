import { IsOptional, IsNumber, IsString } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { SortOrder } from '@common/enums/sort-order.enum';
import { ToLowerCase } from '@/common/decorators/to-lowercase.decorator';
import { IsEnum } from 'class-validator';

export class BreedQueryDto extends PaginationDto {
  @IsOptional()
  @IsNumber()
  speciesId?: number;

  @IsOptional()
  @IsString()
  name?: string;

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
