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
import { PolicyService } from '@/modules/policy/policy.service';
import { PermissionKey } from '@/modules/permission/enums/permission-key.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import {
  BaseService,
  SERVICE_SUFFIX,
} from '../interfaces/base-service.interface';

type ResourceMap = Record<string, Record<string, unknown>>;

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

    const resources = request.resources || {};
    const params = request.params as Record<string, string>;

    const resourceTypesFromConditions =
      await this.policyService.extractResourceTypesFromConditions(
        requiredPermissions,
        userRoles,
      );

    // Preload resource fallback for param id
    for (const resourceType of resourceTypesFromConditions) {
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

    // Get all resource types from resources
    const allResourceTypes = Object.keys(resources);

    // Create cartesian product of all arrays
    const combinations = this.createCartesianProduct(
      resources,
      allResourceTypes,
    );

    // Check each combination with all permissions
    for (const combo of combinations) {
      const results = await Promise.all(
        requiredPermissions.map((perm) =>
          this.policyService.checkAccess(perm, {
            user: { id: user.userId, roles: userRoles },
            resources: combo,
            env: { time: new Date() },
          }),
        ),
      );

      const allAllowed = results.every((r) => r.allowed);
      if (!allAllowed) {
        throw new ForbiddenException('Access denied by policy');
      }
    }

    return true;
  }

  private createCartesianProduct(
    resources: Record<string, unknown>,
    resourceTypes: string[],
  ): ResourceMap[] {
    const items: { type: string; items: unknown[] }[] = [];

    for (const type of resourceTypes) {
      const resource = resources[type];
      if (Array.isArray(resource) && resource.length > 0) {
        items.push({ type, items: resource });
      } else if (resource && !Array.isArray(resource)) {
        items.push({ type, items: [resource] });
      }
    }

    if (items.length === 0) {
      return [{}];
    }

    const combinations: ResourceMap[] = [{}];

    for (const { type, items: arr } of items) {
      const newCombinations: ResourceMap[] = [];

      for (const combo of combinations) {
        for (const item of arr) {
          newCombinations.push({
            ...combo,
            [type]: item as Record<string, unknown>,
          });
        }
      }

      combinations.length = 0;
      combinations.push(...newCombinations);
    }

    return combinations;
  }

  private async loadResource(type: string, id: string): Promise<unknown> {
    // for example: '$resources.medical-record.userId' from a policy, where medical-record is the resource type will be converted into MEDICALRECORD + _SERVICE
    // the service string must be defined in the module like this format 'MEDICALRECORD_SERVICE' for this method to works
    const cleanType = type.replace(/[-_]/g, '').toUpperCase();
    const serviceName = cleanType + '_' + SERVICE_SUFFIX;

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
