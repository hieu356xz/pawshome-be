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

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    private readonly permissionService: PermissionService,
  ) {}

  findAll() {
    return this.roleRepo.find({ relations: ['permissions'] });
  }

  async findOne(id: string) {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return role;
  }

  create(data: { name: string; description?: string }) {
    const role = this.roleRepo.create(data);
    return this.roleRepo.save(role);
  }

  async update(id: string, data: Partial<Role>) {
    const role = await this.findOne(id);
    await this.roleRepo.update(id, data);

    // Invalidate cache if role name changed or permissions updated
    await this.permissionService.invalidateRoleCache(role.name);

    return this.roleRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
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

    // Invalidate cache when permissions change
    await this.permissionService.invalidateRoleCache(role.name);

    return this.roleRepo.save(role);
  }
}
