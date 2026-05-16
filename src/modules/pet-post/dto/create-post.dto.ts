import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { PostType } from '../enums/post-type.enum';
import { PostStatus } from '../enums/post-status.enum';

export class CreatePetPostDto {
  @IsEnum(PostType)
  postType!: PostType;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  @IsNotEmpty()
  contact!: string;
}

export class UpdatePetPostDto {
  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsEnum(PostStatus)
  postStatus?: PostStatus;
}
