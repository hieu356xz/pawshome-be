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
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleQueryDto } from './dto/role-query.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { Role } from './entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';

@Controller('role')
@UseGuards(PolicyGuard)
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get()
  @RequirePermissions('role:list')
  findAll(@Query() query: RoleQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(
    EntityExistGuard(Role, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
  )
  @RequirePermissions('role:read')
  findOne(@Param() { id }: IdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('role:create')
  create(@Body() data: CreateRoleDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @UseGuards(
    EntityExistGuard(Role, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
  )
  @RequirePermissions('role:update')
  update(@Param() { id }: IdParamDto, @Body() data: UpdateRoleDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(Role, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
  )
  @RequirePermissions('role:delete')
  remove(@Param() { id }: IdParamDto) {
    return this.service.remove(id);
  }

  @Post(':id/permissions')
  @UseGuards(
    EntityExistGuard(Role, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    EntityExistGuard(Permission, {
      source: 'body',
      dto: AssignPermissionsDto,
      sourceField: 'permissionIds',
      dbField: 'id',
      key: 'permission',
      allowMultiple: true,
    }),
  )
  @RequirePermissions('permission:assign')
  assignPermissions(
    @Param() { id }: IdParamDto,
    @Body() data: AssignPermissionsDto,
  ) {
    return this.service.assignPermissions(id, data.permissionIds);
  }
}
