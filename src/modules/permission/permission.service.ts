import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type DeepPartial, Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepo: Repository<Permission>,
  ) {}

  findAll() {
    return this.permissionRepo.find();
  }

  findOne(id: string) {
    return this.permissionRepo.findOne({ where: { id } });
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
}
