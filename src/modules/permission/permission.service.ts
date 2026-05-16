import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { DeepPartial } from 'typeorm';
import { BaseService } from '@/common/interfaces/base-service.interface';
import { Permission } from './entities/permission.entity';
import { Role } from '../role/entities/role.entity';
import { PolicyService } from './policy.service';
import type { PolicyEvaluationContext } from './interfaces/policy-condition.interface';

@Injectable()
export class PermissionService implements BaseService<Permission> {
  private readonly CACHE_TTL = 600000; // 10 minutes

  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @Inject(forwardRef(() => PolicyService))
    private policyService: PolicyService,
  ) {}

  async getPermissionsForRoles(roleNames: string[]): Promise<string[]> {
    const permissionsSet = new Set<string>();

    for (const roleName of roleNames) {
      const cacheKey = `permissions:role:${roleName}`;
      let rolePermissions = await this.cacheManager.get<string[]>(cacheKey);

      if (!rolePermissions) {
        const permissions = await this.permissionRepo
          .createQueryBuilder('permission')
          .innerJoin('permission.roles', 'role')
          .where('role.name = :roleName', { roleName })
          .select('permission.key', 'key')
          .getRawMany<{ key: string }>();

        rolePermissions = permissions.map((p) => p.key);
        await this.cacheManager.set(cacheKey, rolePermissions, this.CACHE_TTL);
      }

      rolePermissions.forEach((p) => permissionsSet.add(p));
    }

    return Array.from(permissionsSet);
  }

  matchesPermission(
    userPermissions: string[],
    requiredPermission: string,
  ): boolean {
    return userPermissions.some((userPerm) =>
      this.permissionMatches(userPerm, requiredPermission),
    );
  }

  private permissionMatches(
    userPermission: string,
    requiredPermission: string,
  ): boolean {
    if (userPermission === requiredPermission) {
      return true;
    }

    if (userPermission === '*') {
      return true;
    }

    const [userResource, userAction] = userPermission.split(':');
    const [requiredResource, requiredAction] = requiredPermission.split(':');

    if (
      userResource === requiredResource &&
      (userAction === '*' || requiredAction === '*')
    ) {
      return true;
    }

    return false;
  }

  async checkAccess(
    requiredPermission: string,
    userId: string,
    userRoles: string[],
    resource: Record<string, any>,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const context: PolicyEvaluationContext = {
      user: { id: userId, roles: userRoles },
      resource,
      env: { time: new Date() },
    };

    const result = await this.policyService.checkAccess(
      requiredPermission,
      context,
    );

    return {
      allowed: result.allowed,
      reason: result.reason,
    };
  }

  async invalidateRoleCache(roleName: string): Promise<void> {
    const cacheKey = `permissions:role:${roleName}`;
    await this.cacheManager.del(cacheKey);
    await this.policyService.invalidateRolePolicies(roleName);
  }

  async invalidateRolesCache(roleNames: string[]): Promise<void> {
    await Promise.all(roleNames.map((name) => this.invalidateRoleCache(name)));
  }

  findAll() {
    return this.permissionRepo.find({ relations: ['roles'] });
  }

  findOne(id: string) {
    return this.permissionRepo.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  create(data: DeepPartial<Permission>) {
    const permission = this.permissionRepo.create(data);
    return this.permissionRepo.save(permission);
  }

  async update(id: string, data: Partial<Permission>) {
    await this.permissionRepo.update(id, data);
    return this.permissionRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    const result = await this.permissionRepo.delete(id);
    return !!result.affected;
  }

  async getRoleNamesByIds(roleIds: string[]): Promise<string[]> {
    const roles = await this.permissionRepo.manager.find(Role, {
      where: { id: In(roleIds) },
      select: ['name'],
    });
    return roles.map((r) => r.name);
  }
}
