import { IsArray, IsUUID } from 'class-validator';

export class AssignPermissionsDto {
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds!: string[];
}
