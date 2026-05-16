import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
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
import { UserStatus } from './enums/user-status.enum';

const ROLE_HIERARCHY: Record<string, number> = {
  admin: 1,
  manager: 2,
  staff: 3,
  veterinarian: 4,
  member: 5,
  volunteer: 6,
};

const getRoleLevel = (role: Role): number => {
  return ROLE_HIERARCHY[role.name] ?? 999;
};

const getHighestRoleLevel = (roles: Role[]): number => {
  if (!roles.length) return 999;
  return Math.min(...roles.map(getRoleLevel));
};

const canAssignRole = (
  currentUserRoles: Role[],
  targetUserRoles: Role[],
): boolean => {
  const currentLevel = getHighestRoleLevel(currentUserRoles);
  const targetLevel = getHighestRoleLevel(targetUserRoles);
  return currentLevel < targetLevel;
};

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
      withDeleted: true,
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

  async findRoleByName(name: string) {
    return this.userRepo.manager.findOne(Role, {
      where: { name },
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
    if (!(await this.isUserExist(id))) {
      throw new NotFoundException(`User #${id} does not exist`);
    }

    if (data.password) {
      data.password = await this.hashPassword(data.password);
    }

    await this.userRepo.update(id, data);
    return this.userRepo.findOne({ where: { id } });
  }

  async remove(id: string) {
    if (!(await this.isUserExist(id))) {
      throw new NotFoundException(`User #${id} does not exist`);
    }

    const result = await this.userRepo.softDelete(id);
    return !!result.affected;
  }

  async assignRoles(userId: string, roleIds: string[], currentUserId: string) {
    const targetUser = await this.findOne(userId);
    const currentUser = await this.findOne(currentUserId);

    if (!canAssignRole(currentUser.roles, targetUser.roles)) {
      throw new ForbiddenException(
        'You cannot assign roles to users with higher or equal privileges',
      );
    }

    const roles = await this.userRepo.manager.find(Role, {
      where: { id: In(roleIds) },
    });

    targetUser.roles = roles;
    return this.userRepo.save(targetUser);
  }

  async banUser(id: string, reason: string | undefined, adminId: string) {
    const user = await this.findOne(id);

    if (user.status === UserStatus.BANNED) {
      throw new ConflictException('User is already banned');
    }

    user.status = UserStatus.BANNED;
    user.bannedAt = new Date();
    user.banReason = reason ?? null;
    user.bannedBy = adminId;

    return this.userRepo.save(user);
  }

  async unbanUser(id: string) {
    const user = await this.findOne(id);

    if (user.status !== UserStatus.BANNED) {
      throw new ConflictException('User is not banned');
    }

    user.status = UserStatus.ACTIVE;
    user.bannedAt = null;
    user.banReason = null;
    user.bannedBy = null;

    return this.userRepo.save(user);
  }

  protected async isUserExist(id: string) {
    return this.userRepo.exists({ where: { id: id } });
  }
}
