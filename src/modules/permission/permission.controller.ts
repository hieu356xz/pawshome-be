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
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto/update-permission.dto';
import { PermissionQueryDto } from './dto/permission-query.dto';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { Permission } from './entities/permission.entity';

@Controller('permission')
@UseGuards(PolicyGuard)
export class PermissionController {
  constructor(private readonly service: PermissionService) {}

  @Get()
  @RequirePermissions('permission:list')
  findAll(@Query() query: PermissionQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(
    EntityExistGuard(Permission, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
  )
  @RequirePermissions('permission:read')
  findOne(@Param() { id }: IdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('permission:create')
  create(@Body() data: CreatePermissionDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @UseGuards(
    EntityExistGuard(Permission, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
  )
  @RequirePermissions('permission:update')
  update(@Param() { id }: IdParamDto, @Body() data: UpdatePermissionDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(Permission, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
  )
  @RequirePermissions('permission:delete')
  remove(@Param() { id }: IdParamDto) {
    return this.service.remove(id);
  }
}
