import { IsUUID, IsNotEmpty } from 'class-validator';

export class BlogPostIdParamDto {
  @IsNotEmpty()
  @IsUUID()
  postId!: string;

  @IsNotEmpty()
  @IsUUID()
  id!: string;
}
