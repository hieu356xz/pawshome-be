import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { SortOrder } from '@common/enums/sort-order.enum';
import { ToLowerCase } from '@/common/decorators/to-lowercase.decorator';
import { BlogPostStatus } from '../enums/blog-post-status.enum';

export class BlogPostQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  tagId?: number;

  @IsOptional()
  @IsEnum(BlogPostStatus)
  status?: BlogPostStatus;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @ToLowerCase()
  @IsString()
  sortOrder?: SortOrder;
}
