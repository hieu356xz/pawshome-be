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
import { PolicyService } from './policy.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { PolicyQueryDto } from './dto/policy-query.dto';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PolicyParamsDto } from './dto/policy-params.dto';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';

@Controller('policy')
@UseGuards(PolicyGuard)
export class PolicyController {
  constructor(private readonly service: PolicyService) {}

  @Get()
  @UseGuards(PolicyGuard)
  @RequirePermissions('policy:list')
  findAll(@Query() query: PolicyQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':roleId/:permissionId')
  @UseGuards(
    EntityExistGuard(Role, {
      source: 'params',
      sourceField: 'roleId',
      dto: PolicyParamsDto,
      dbField: 'id',
    }),
    EntityExistGuard(Permission, {
      source: 'params',
      sourceField: 'permissionId',
      dto: PolicyParamsDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('policy:read')
  findOne(@Param() params: PolicyParamsDto) {
    return this.service.findOne(params.roleId, params.permissionId);
  }

  @Post()
  @UseGuards(
    EntityExistGuard(Role, {
      source: 'body',
      sourceField: 'roleId',
      dto: CreatePolicyDto,
      dbField: 'id',
      key: 'role',
      allowMultiple: false,
    }),
    EntityExistGuard(Permission, {
      source: 'body',
      sourceField: 'permissionId',
      dto: CreatePolicyDto,
      dbField: 'id',
      key: 'permission',
      allowMultiple: false,
    }),
    PolicyGuard,
  )
  @RequirePermissions('policy:create')
  create(@Body() data: CreatePolicyDto) {
    return this.service.create(data);
  }

  @Patch(':roleId/:permissionId')
  @UseGuards(
    EntityExistGuard(Role, {
      source: 'params',
      sourceField: 'roleId',
      dto: PolicyParamsDto,
      dbField: 'id',
    }),
    EntityExistGuard(Permission, {
      source: 'params',
      sourceField: 'permissionId',
      dto: PolicyParamsDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('policy:update')
  update(@Param() params: PolicyParamsDto, @Body() data: UpdatePolicyDto) {
    return this.service.updatePolicy(params.roleId, params.permissionId, data);
  }

  @Delete(':roleId/:permissionId')
  @UseGuards(
    EntityExistGuard(Role, {
      source: 'params',
      sourceField: 'roleId',
      dto: PolicyParamsDto,
      dbField: 'id',
    }),
    EntityExistGuard(Permission, {
      source: 'params',
      sourceField: 'permissionId',
      dto: PolicyParamsDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('policy:delete')
  remove(@Param() params: PolicyParamsDto) {
    return this.service.deletePolicy(params.roleId, params.permissionId);
  }
}
