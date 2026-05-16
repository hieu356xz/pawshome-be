import { IsUUID, IsNotEmpty } from 'class-validator';

export class IdParamDto {
  @IsNotEmpty()
  @IsUUID()
  id!: string;
}
