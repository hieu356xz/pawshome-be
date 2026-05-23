import { IsOptional, IsNumber, IsString } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { SortOrder } from '@common/enums/sort-order.enum';
import { ToUpperCase } from '@/common/decorators/to-uppercase.decorator';
import { IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class BreedQueryDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
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
  @ToUpperCase()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
