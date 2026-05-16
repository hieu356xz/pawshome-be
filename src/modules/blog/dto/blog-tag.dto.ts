import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBlogTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}

export class UpdateBlogTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
