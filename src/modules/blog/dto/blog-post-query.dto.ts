import { IsOptional, IsString, IsNumber } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { SortOrder } from '@common/enums/sort-order.enum';
import { ToUpperCase } from '@common/decorators/to-uppercase.decorator';

export class QueryBlogPostDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  tagId?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @ToUpperCase()
  @IsString()
  sortOrder?: SortOrder;
}
