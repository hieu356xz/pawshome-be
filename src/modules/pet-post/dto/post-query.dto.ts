import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { PostType } from '../enums/post-type.enum';
import { PostStatus } from '../enums/post-status.enum';

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
  @IsBoolean()
  includeDeleted?: boolean;
}

export class SearchImageDto {
  @IsString()
  @IsNotEmpty()
  imageBase64!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;
}
