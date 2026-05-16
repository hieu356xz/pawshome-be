import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsOrder } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { DeepPartial } from 'typeorm';
import { BaseService } from '@/common/interfaces/base-service.interface';
import { Permission } from './entities/permission.entity';
import { Role } from '@modules/role/entities/role.entity';
import { PolicyService } from '@modules/policy/policy.service';
import type { PolicyEvaluationContext } from '@modules/policy/interfaces/policy-condition.interface';
import { PermissionKey } from './enums/permission-key.enum';
import { PermissionQueryDto } from './dto/permission-query.dto';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';

@Injectable()
export class PermissionService implements BaseService<Permission> {
  private readonly CACHE_TTL = 600000;

  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    @Inject(forwardRef(() => PolicyService))
    private policyService: PolicyService,
  ) {}

  async findAll(
    query: PermissionQueryDto,
  ): Promise<PaginatedResponse<Permission>> {
    const { page, limit, key, description, search, sortBy, sortOrder } = query;

    const queryBuilder = this.permissionRepo
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.roles', 'roles');

    if (key) {
      queryBuilder.andWhere('permission.key = :key', { key });
    }

    if (description) {
      queryBuilder.andWhere('permission.description LIKE :description', {
        description: `%${description}%`,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(permission.key ILIKE :search OR permission.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (sortBy) {
      queryBuilder.orderBy(`permission.${sortBy}`, sortOrder ?? 'ASC');
    } else {
      queryBuilder.orderBy('permission.key', 'ASC');
    }

    queryBuilder.take(limit).skip((page - 1) * limit);

    const [results, total] = await queryBuilder.getManyAndCount();

    const meta: ResponseMeta = {
      totalItems: total,
      itemCount: results.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };

    return { results, meta };
  }

  async getPermissionsForRoles(roleNames: string[]): Promise<PermissionKey[]> {
    const permissionsSet = new Set<PermissionKey>();

    for (const roleName of roleNames) {
      const cacheKey = `permissions:role:${roleName}`;
      let rolePermissions =
        await this.cacheManager.get<PermissionKey[]>(cacheKey);

      if (!rolePermissions) {
        const permissions = await this.permissionRepo
          .createQueryBuilder('permission')
          .innerJoin('permission.roles', 'role')
          .where('role.name = :roleName', { roleName })
          .andWhere('permission.assignable = :assignable', { assignable: true })
          .select('permission.key', 'key')
          .getRawMany<{ key: PermissionKey }>();

        rolePermissions = permissions.map((p) => p.key);
        await this.cacheManager.set(cacheKey, rolePermissions, this.CACHE_TTL);
      }

      rolePermissions.forEach((p) => permissionsSet.add(p));
    }

    return Array.from(permissionsSet);
  }

  matchesPermission(
    userPermissions: PermissionKey[],
    requiredPermission: PermissionKey,
  ): boolean {
    return userPermissions.some((userPerm) =>
      this.permissionMatches(userPerm, requiredPermission),
    );
  }

  private permissionMatches(
    userPermission: PermissionKey,
    requiredPermission: PermissionKey,
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
    requiredPermission: PermissionKey,
    userId: string,
    userRoles: string[],
    resources: Record<string, Record<string, unknown>>,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const context: PolicyEvaluationContext = {
      user: { id: userId, roles: userRoles },
      resources,
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

  async findOne(id: string) {
    const permission = await this.permissionRepo.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!permission) {
      throw new NotFoundException(`Permission #${id} not found`);
    }
    return permission;
  }

  async create(data: DeepPartial<Permission>) {
    if (data.key) {
      const existing = await this.permissionRepo.findOne({
        where: { key: data.key },
      });
      if (existing) {
        throw new BadRequestException(
          `Permission "${data.key}" already exists`,
        );
      }
    }
    const permission = this.permissionRepo.create(data);
    return this.permissionRepo.save(permission);
  }

  async update(id: string, data: Partial<Permission>) {
    if (!(await this.isPermissionExist(id))) {
      throw new NotFoundException(`Permission #${id} not found`);
    }

    if (data.key) {
      const existing = await this.permissionRepo.findOne({
        where: { key: data.key },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Permission "${data.key}" already exists`,
        );
      }
    }

    await this.permissionRepo.update(id, data);
    return this.permissionRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    if (!(await this.isPermissionExist(id))) {
      throw new NotFoundException(`Permission #${id} not found`);
    }

    const result = await this.permissionRepo.softDelete(id);
    return !!result.affected;
  }

  async getRoleNamesByIds(roleIds: string[]): Promise<string[]> {
    const roles = await this.permissionRepo.manager.find(Role, {
      where: { id: In(roleIds) },
      select: ['name'],
    });
    return roles.map((r) => r.name);
  }

  protected async isPermissionExist(id: string) {
    return this.permissionRepo.exists({ where: { id } });
  }
}
