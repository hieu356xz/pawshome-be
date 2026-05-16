import { IsUUID, IsNotEmpty } from 'class-validator';

export class PetPostIdParamDto {
  @IsNotEmpty()
  @IsUUID()
  postId!: string;

  @IsNotEmpty()
  @IsUUID()
  id!: string;
}
