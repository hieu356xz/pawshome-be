import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { SortOrder } from '@common/enums/sort-order.enum';
import { ToUpperCase } from '@common/decorators/to-uppercase.decorator';
import { IsEnum } from 'class-validator';

export class SpeciesQueryDto extends PaginationDto {
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
