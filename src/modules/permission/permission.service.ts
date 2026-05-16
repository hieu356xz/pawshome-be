import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { DeepPartial } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from '../role/entities/role.entity';

@Injectable()
export class PermissionService {
  private readonly CACHE_TTL = 600000; // 10 minutes

  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  /**
   * Get all permissions for given role names (with caching)
   * Cache key: permissions:role:{roleName}
   */
  async getPermissionsForRoles(roleNames: string[]): Promise<string[]> {
    const permissionsSet = new Set<string>();

    for (const roleName of roleNames) {
      const cacheKey = `permissions:role:${roleName}`;
      let rolePermissions = await this.cacheManager.get<string[]>(cacheKey);

      if (!rolePermissions) {
        // Cache miss - query database
        const permissions = await this.permissionRepo
          .createQueryBuilder('permission')
          .innerJoin('permission.roles', 'role')
          .where('role.name = :roleName', { roleName })
          .select('permission.key', 'key')
          .getRawMany<{ key: string }>();

        rolePermissions = permissions.map((p) => p.key);

        // Store in cache
        await this.cacheManager.set(cacheKey, rolePermissions, this.CACHE_TTL);
      }

      rolePermissions.forEach((p) => permissionsSet.add(p));
    }

    return Array.from(permissionsSet);
  }

  /**
   * Invalidate cache for a specific role
   * Call this when role permissions are updated
   */
  async invalidateRoleCache(roleName: string): Promise<void> {
    const cacheKey = `permissions:role:${roleName}`;
    await this.cacheManager.del(cacheKey);
  }

  /**
   * Invalidate cache for multiple roles
   */
  async invalidateRolesCache(roleNames: string[]): Promise<void> {
    await Promise.all(roleNames.map((name) => this.invalidateRoleCache(name)));
  }

  /**
   * Check if user has a specific permission
   * Supports wildcards: user:*, *
   */
  matchesPermission(
    userPermissions: string[],
    requiredPermission: string,
  ): boolean {
    return userPermissions.some((userPerm) =>
      this.permissionMatches(userPerm, requiredPermission),
    );
  }

  /**
   * Check permission with wildcard support
   */
  private permissionMatches(
    userPermission: string,
    requiredPermission: string,
  ): boolean {
    // Exact match
    if (userPermission === requiredPermission) {
      return true;
    }

    // Super admin wildcard
    if (userPermission === '*') {
      return true;
    }

    // Resource wildcard (e.g., user:* matches user:read)
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

  // CRUD operations
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

  // Additional: Get role names from role IDs (for cache invalidation)
  async getRoleNamesByIds(roleIds: string[]): Promise<string[]> {
    const roles = await this.permissionRepo.manager.find(Role, {
      where: { id: In(roleIds) },
      select: ['name'],
    });
    return roles.map((r) => r.name);
  }
}
