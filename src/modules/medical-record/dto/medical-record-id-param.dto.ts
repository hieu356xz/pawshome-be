import { IsUUID, IsNotEmpty } from 'class-validator';

export class MedicalRecordIdParamDto {
  @IsNotEmpty()
  @IsUUID()
  petId!: string;

  @IsNotEmpty()
  @IsUUID()
  id!: string;
}
