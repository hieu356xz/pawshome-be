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
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userRoles = user.roles || [];
    const resourceTypes =
      await this.policyService.extractResourceTypesFromConditions(
        requiredPermissions,
        userRoles,
      );

    const resources = request.resources || {};
    const params = request.params as Record<string, string>;

    for (const resourceType of resourceTypes) {
      if (!resources[resourceType]) {
        const resourceIdParam = params?.id;
        if (resourceIdParam) {
          const loaded = await this.loadResource(resourceType, resourceIdParam);
          if (loaded) {
            resources[resourceType] = loaded as Record<string, unknown>;
          }
        }
      }
    }

    for (const requiredPerm of requiredPermissions) {
      const result = await this.policyService.checkAccess(requiredPerm, {
        user: { id: user.userId, roles: userRoles },
        resources,
        env: { time: new Date() },
      });

      if (!result.allowed) {
        throw new ForbiddenException('Access denied by policy');
      }
    }

    return true;
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
    } catch (error) {
      Logger.log(
        `Failed to get service ${serviceName} for resource type ${type}`,
        error,
      );
      return null;
    }
  }
}
