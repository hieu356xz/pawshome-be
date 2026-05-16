import { IsNotEmpty, IsString } from 'class-validator';
import type { PermissionKey } from '../enums/permission-key.enum';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  key!: PermissionKey;

  @IsString()
  description!: string;
}
