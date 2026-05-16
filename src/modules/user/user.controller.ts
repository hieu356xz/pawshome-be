import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { User } from './entities/user.entity';
import { Role } from '@modules/role/entities/role.entity';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  @UseGuards(PolicyGuard)
  @RequirePermissions('user:list')
  findAll(@Query() query: UserQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(
    EntityExistGuard(User, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('user:read')
  findOne(@Param() { id }: IdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(PolicyGuard)
  @RequirePermissions('user:create')
  create(@Body() data: CreateUserDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @UseGuards(
    EntityExistGuard(User, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('user:update')
  update(@Param() { id }: IdParamDto, @Body() data: UpdateUserDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(User, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('user:delete')
  remove(@Param() { id }: IdParamDto) {
    return this.service.remove(id);
  }

  @Post(':id/roles')
  @UseGuards(
    EntityExistGuard(User, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    EntityExistGuard(Role, {
      source: 'body',
      dto: AssignRolesDto,
      sourceField: 'roleIds',
      dbField: 'id',
      key: 'role',
      allowMultiple: true,
    }),
    PolicyGuard,
  )
  @RequirePermissions('role:assign')
  assignRoles(@Param() { id }: IdParamDto, @Body() data: AssignRolesDto) {
    return this.service.assignRoles(id, data.roleIds);
  }
}
