import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';
import { PermissionService } from '@modules/permission/permission.service';
import { RoleQueryDto } from './dto/role-query.dto';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';
import { BaseService } from '@/common/interfaces/base-service.interface';

@Injectable()
export class RoleService implements BaseService<Role> {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    private readonly permissionService: PermissionService,
  ) {}

  async findAll(query: RoleQueryDto): Promise<PaginatedResponse<Role>> {
    const { page, limit, name, search, sortBy, sortOrder } = query;

    const queryBuilder = this.roleRepo
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions');

    if (name) {
      queryBuilder.andWhere('role.name = :name', { name });
    }

    if (search) {
      queryBuilder.andWhere('role.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (sortBy) {
      queryBuilder.orderBy(`role.${sortBy}`, sortOrder ?? 'ASC');
    } else {
      queryBuilder.orderBy('role.createdAt', 'DESC');
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

  async findOne(id: string) {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return role;
  }

  async create(data: { name: string; description?: string }) {
    const existing = await this.roleRepo.findOne({
      where: { name: data.name },
    });
    if (existing) {
      throw new BadRequestException(`Role "${data.name}" already exists`);
    }
    const role = this.roleRepo.create(data);
    return this.roleRepo.save(role);
  }

  async update(id: string, data: Partial<Role>) {
    if (!(await this.isRoleExist(id))) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    if (data.name) {
      const existing = await this.roleRepo.findOne({
        where: { name: data.name },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Role "${data.name}" already exists`);
      }
    }

    const oldRole = await this.findOne(id);
    await this.roleRepo.update(id, data);

    if (data.name && data.name !== oldRole.name) {
      await this.permissionService.invalidateRoleCache(oldRole.name);
      await this.permissionService.invalidateRoleCache(data.name);
    }

    return this.roleRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    if (!(await this.isRoleExist(id))) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    const role = await this.findOne(id);
    await this.permissionService.invalidateRoleCache(role.name);

    const result = await this.roleRepo.delete(id);
    return !!result.affected;
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    const role = await this.findOne(roleId);
    const permissions = await this.roleRepo.manager.find(Permission, {
      where: { id: In(permissionIds) },
    });

    const nonAssignable = permissions.filter((p) => !p.assignable);
    if (nonAssignable.length > 0) {
      const keys = nonAssignable.map((p) => p.key).join(', ');
      throw new BadRequestException(
        `Cannot assign non-assignable permissions: ${keys}`,
      );
    }

    role.permissions = permissions;

    await this.permissionService.invalidateRoleCache(role.name);

    return this.roleRepo.save(role);
  }

  protected async isRoleExist(id: string) {
    return this.roleRepo.exists({ where: { id } });
  }
}
