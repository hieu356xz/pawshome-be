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

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  @RequirePermissions('user:list')
  @UseGuards(PolicyGuard)
  findAll(@Query() query: UserQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('user:read')
  @UseGuards(
    EntityExistGuard(User, { param: 'id', dto: IdParamDto }),
    PolicyGuard,
  )
  findOne(@Param() { id }: IdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('user:create')
  @UseGuards(
    EntityExistGuard(User, { param: 'id', dto: IdParamDto }),
    PolicyGuard,
  )
  create(@Body() data: CreateUserDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @RequirePermissions('user:update')
  @UseGuards(
    EntityExistGuard(User, { param: 'id', dto: IdParamDto }),
    PolicyGuard,
  )
  update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(User, { param: 'id', dto: IdParamDto }),
    PolicyGuard,
  )
  @RequirePermissions('user:delete')
  remove(@Param() { id }: IdParamDto) {
    return this.service.remove(id);
  }

  @Post(':id/roles')
  @RequirePermissions('user:update', 'role:assign')
  @UseGuards(
    EntityExistGuard(User, { param: 'id', dto: IdParamDto }),
    // TODO: need to support checking role ids in the body
    PolicyGuard,
  )
  assignRoles(@Param() { id }: IdParamDto, @Body() data: AssignRolesDto) {
    return this.service.assignRoles(id, data.roleIds);
  }
}
