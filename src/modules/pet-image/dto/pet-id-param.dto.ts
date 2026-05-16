import { IsUUID, IsNotEmpty } from 'class-validator';

export class PetIdParamDto {
  @IsNotEmpty()
  @IsUUID()
  petId!: string;
}
