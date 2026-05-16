import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
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
    await this.roleRepo.update(id, data);
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
    role.permissions = permissions;
    return this.roleRepo.save(role);
  }
}
