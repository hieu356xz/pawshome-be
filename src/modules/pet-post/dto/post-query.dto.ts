import { IsOptional, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { PostType } from '../enums/post-type.enum';
import { PostStatus } from '../enums/post-status.enum';
import { ToUpperCase } from '@common/decorators/to-uppercase.decorator';
import { SortOrder } from '@/common/enums/sort-order.enum';

export class PetPostQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;

  @IsOptional()
  @IsEnum(PostStatus)
  postStatus?: PostStatus;

  @IsOptional()
  @IsString()
  location?: string;

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

export class SearchImageDto {
  @IsString()
  @IsNotEmpty()
  imageBase64!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}
