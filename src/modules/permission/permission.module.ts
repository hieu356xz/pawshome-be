import { Global, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Permission } from './entities/permission.entity';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { PolicyModule } from './policy.module';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

export const PERMISSION_SERVICE = `PERMISSION_${SERVICE_SUFFIX}`;

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Permission]),
    CacheModule.register(),
    forwardRef(() => PolicyModule),
  ],
  controllers: [PermissionController],
  providers: [
    PermissionService,
    PolicyGuard,
    {
      provide: PERMISSION_SERVICE,
      useExisting: PermissionService,
    },
  ],
  exports: [PermissionService, PolicyModule, PolicyGuard, PERMISSION_SERVICE],
})
export class PermissionModule {}
