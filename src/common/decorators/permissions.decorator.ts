import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '@/modules/permission/enums/permission-key.enum';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Marks a route with required permissions
 * Multiple permissions are checked with OR logic (need at least one)
 * Supports wildcards like 'user:*' or '*'
 * @usage @Permissions('user:read')
 * @usage @Permissions('user:create', 'user:update')
 * @usage @Permissions('user:*')
 */
export const Permissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
