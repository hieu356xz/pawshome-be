import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from '@modules/role/entities/role.entity';
import { PaginationDto } from '@common/dto/pagination.dto';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResponse<User>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const [results, total] = await this.userRepo.findAndCount({
      relations: ['roles', 'roles.permissions'],
      take: limit,
      skip: (page - 1) * limit,
    });

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

  async create(data: Partial<User>) {
    if (data.password) {
      data.password = await this.hashPassword(data.password);
    }
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
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
