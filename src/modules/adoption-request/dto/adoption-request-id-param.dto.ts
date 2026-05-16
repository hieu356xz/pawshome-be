import { IsUUID, IsNotEmpty } from 'class-validator';

export class AdoptionRequestIdParamDto {
  @IsNotEmpty()
  @IsUUID()
  petId!: string;

  @IsNotEmpty()
  @IsUUID()
  id!: string;
}
