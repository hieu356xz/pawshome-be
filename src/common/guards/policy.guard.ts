import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PolicyService } from '@modules/permission/policy.service';
import { PermissionKey } from '@/modules/permission/enums/permission-key.enum';
import { UserPayload } from '@modules/auth/interfaces/user-payload.interface';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import {
  BaseService,
  SERVICE_SUFFIX,
} from '../interfaces/base-service.interface';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private policyService: PolicyService,
    private moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<PermissionKey[] | undefined>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as UserPayload;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    for (const requiredPerm of requiredPermissions) {
      const resourceType = this.extractResourceType(requiredPerm);
      const params = request.params as Record<string, string>;
      const resourceIdParam = params?.id;

      const resource: Record<string, unknown> = {};

      if (resourceIdParam) {
        const loaded = await this.loadResource(resourceType, resourceIdParam);
        if (!loaded) {
          throw new ForbiddenException('Resource not found');
        }
        Object.assign(resource, loaded);
      }

      const result = await this.policyService.checkAccess(requiredPerm, {
        user: { id: user.userId, roles: user.roles },
        resource,
        env: { time: new Date() },
      });

      if (!result.allowed) {
        throw new ForbiddenException('Access denied by policy');
      }
    }

    return true;
  }

  private extractResourceType(permissionKey: PermissionKey): string {
    const parts = permissionKey.split(':');
    return parts[0] || 'unknown';
  }

  private async loadResource(type: string, id: string): Promise<unknown> {
    const serviceName = type.toUpperCase() + '_' + SERVICE_SUFFIX;
    // console.log(
    //   `Attempting to load resource of type ${type} with ID ${id} using service ${serviceName}`,
    // );
    try {
      const service = this.moduleRef.get<BaseService>(serviceName, {
        strict: false,
      });
      // console.log(`Service found: ${service.constructor.name}`);

      if (!service || typeof service.findOne !== 'function') {
        return null;
      }

      return await service.findOne(id);
    } catch (error) {
      Logger.log(
        `Failed to get service ${serviceName} for resource type ${type}`,
        error,
      );
      return null;
    }
  }
}
