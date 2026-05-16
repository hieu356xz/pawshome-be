import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PolicyService } from '@modules/permission/policy.service';
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
    const requiredPermission = this.reflector.get<string | undefined>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as UserPayload;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const resourceType = this.extractResourceType(requiredPermission);
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

    const result = await this.policyService.checkAccess(requiredPermission, {
      user: { id: user.userId, roles: user.roles },
      resource,
      env: { time: new Date() },
    });

    if (!result.allowed) {
      throw new ForbiddenException(result.reason || 'Access denied by policy');
    }

    return true;
  }

  private extractResourceType(permissionKey: string): string {
    const parts = permissionKey.split(':');
    return parts[0] || 'unknown';
  }

  private async loadResource(type: string, id: string): Promise<unknown> {
    const serviceName = type.toUpperCase() + '_' + SERVICE_SUFFIX;
    try {
      const service = this.moduleRef.get<BaseService>(serviceName, {
        strict: false,
      });

      if (!service || typeof service.findOne !== 'function') {
        return null;
      }

      return await service.findOne(id);
    } catch {
      return null;
    }
  }
}
