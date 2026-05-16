import { IsUUID, IsNotEmpty } from 'class-validator';

export class PetImageIdParamDto {
  @IsNotEmpty()
  @IsUUID()
  petId!: string;

  @IsNotEmpty()
  @IsUUID()
  id!: string;
}
