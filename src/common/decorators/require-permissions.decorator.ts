import { applyDecorators, UseGuards } from '@nestjs/common';
import { Permissions } from './permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PermissionKey } from '@/modules/permission/enums/permission-key.enum';

/**
 * A convenience decoratorthat marks a route with @Permissions and @PermissionsGuard
 * Multiple permissions are checked with OR logic (need at least one)
 * Supports wildcards like 'user:*' or '*'
 * @usage @RequiredPermissions('user:read')
 * @usage @RequiredPermissions('user:create', 'user:update')
 * @usage @RequiredPermissions('user:*')
 */
export function RequirePermissions(...permissions: PermissionKey[]) {
  return applyDecorators(
    Permissions(...permissions),
    UseGuards(PermissionsGuard),
  );
}
