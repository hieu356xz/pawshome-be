import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../guards/permissions.guard';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Marks a route with required permissions
 * Multiple permissions are checked with OR logic (need at least one)
 * Supports wildcards like 'user:*' or '*'
 * @usage @Permissions('user:read')
 * @usage @Permissions('user:create', 'user:update')
 * @usage @Permissions('user:*')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
/**
 * A convenience decoratorthat marks a route with @Permissions and @PermissionsGuard
 * Multiple permissions are checked with OR logic (need at least one)
 * Supports wildcards like 'user:*' or '*'
 * @usage @RequiredPermissions('user:read')
 * @usage @RequiredPermissions('user:create', 'user:update')
 * @usage @RequiredPermissions('user:*')
 */
export const RequiredPermissions = (...permissions: string[]) =>
  applyDecorators(Permissions(...permissions), UseGuards(PermissionsGuard));
