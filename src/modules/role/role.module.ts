import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { PermissionModule } from '../permission/permission.module';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

const ROLE_SERVICE = `ROLE_${SERVICE_SUFFIX}`;

@Module({
  imports: [TypeOrmModule.forFeature([Role]), PermissionModule],
  controllers: [RoleController],
  providers: [
    RoleService,
    {
      provide: ROLE_SERVICE,
      useExisting: RoleService,
    },
  ],
  exports: [RoleService, ROLE_SERVICE],
})
export class RoleModule {}
