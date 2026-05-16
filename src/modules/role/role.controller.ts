import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto/update-role.dto';

@Controller('role')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: CreateRoleDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/permissions')
  assignPermissions(
    @Param('id') id: string,
    @Body() data: { permissionIds: string[] },
  ) {
    return this.service.assignPermissions(id, data.permissionIds);
  }
}
