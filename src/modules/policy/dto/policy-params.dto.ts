import { IsNotEmpty, IsUUID } from 'class-validator';

export class PolicyParamsDto {
  @IsNotEmpty()
  @IsUUID()
  roleId!: string;

  @IsNotEmpty()
  @IsUUID()
  permissionId!: string;
}
