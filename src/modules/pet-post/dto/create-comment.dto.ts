import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  comment!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class ReplyCommentDto {
  @IsString()
  @IsNotEmpty()
  comment!: string;
}
