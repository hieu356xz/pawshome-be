import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { IdParamDto } from '@/common/dto/id-param.dto';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  @RequirePermissions('user:list')
  findAll(@Query() query: UserQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('user:read')
  findOne(@Param() { id }: IdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('user:create')
  create(@Body() data: CreateUserDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @RequirePermissions('user:update')
  update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  remove(@Param() { id }: IdParamDto) {
    return this.service.remove(id);
  }

  @Post(':id/roles')
  @RequirePermissions('user:update')
  assignRoles(@Param() { id }: IdParamDto, @Body() data: AssignRolesDto) {
    return this.service.assignRoles(id, data.roleIds);
  }
}
