import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '@modules/role/entities/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  findAll() {
    return this.userRepo.find({ relations: ['roles', 'roles.permissions'] });
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  create(data: Partial<User>) {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async update(id: string, data: Partial<User>) {
    await this.userRepo.update(id, data);
    return this.userRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    const result = await this.userRepo.delete(id);
    return !!result.affected;
  }

  async assignRoles(userId: string, roleIds: string[]) {
    const user = await this.findOne(userId);
    const roles = await this.userRepo.manager.find(Role, {
      where: { id: In(roleIds) },
    });
    user.roles = roles;
    return this.userRepo.save(user);
  }
}
