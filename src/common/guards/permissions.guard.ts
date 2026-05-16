import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PermissionService } from '@modules/permission/permission.service';
import { UserPayload } from '@modules/auth/interfaces/user-payload.interface';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface RequestWithUser extends Request {
  user?: UserPayload;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Get permissions for user's roles (with caching)
    const userPermissions = await this.permissionService.getPermissionsForRoles(
      user.roles,
    );

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some((required) =>
      this.permissionService.matchesPermission(userPermissions, required),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Access denied. Insufficient permissions.');
    }

    return true;
  }
}
