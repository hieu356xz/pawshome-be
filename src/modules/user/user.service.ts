import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  FindOptionsWhere,
  FindOptionsOrder,
  Like,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BaseService } from '@/common/interfaces/base-service.interface';
import { User } from './entities/user.entity';
import { Role } from '@modules/role/entities/role.entity';
import { UserQueryDto } from './dto/user-query.dto';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';

@Injectable()
export class UserService implements BaseService<User> {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAll(query: UserQueryDto): Promise<PaginatedResponse<User>> {
    const { page, limit, status, email, name, roleId, sortBy, sortOrder } =
      query;

    const where: FindOptionsWhere<User> = {};

    if (status) {
      where.status = status;
    }

    if (email) {
      where.email = Like(`%${email}%`);
    }

    if (name) {
      where.fullName = Like(`%${name}%`);
    }

    if (roleId) {
      where.roles = { id: roleId };
    }

    const order: FindOptionsOrder<User> = {};
    if (sortBy) {
      order[sortBy] = sortOrder ?? 'ASC';
    }

    const [results, total] = await this.userRepo.findAndCount({
      where,
      order,
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
    if (!user) throw new NotFoundException(`User #${id} does not exist`);
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async findByGoogleId(googleId: string) {
    return this.userRepo.findOne({
      where: { googleId },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
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
    if (await this.isUserExist(id)) {
      throw new NotFoundException(`User #${id} does not exist`);
    }

    await this.userRepo.update(id, data);
    return this.userRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    if (await this.isUserExist(id)) {
      throw new NotFoundException(`User #${id} does not exist`);
    }

    const result = await this.userRepo.softDelete(id);
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

  protected async isUserExist(id: string) {
    return this.userRepo.exists({ where: { id: id } });
  }
}
