import { IsString, IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PostType } from '../enums/post-type.enum';
import { PostStatus } from '../enums/post-status.enum';

export class PetPostSearchDto {
  @IsOptional()
  @IsString()
  text?: string;

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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}
