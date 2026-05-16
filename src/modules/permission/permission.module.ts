import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Permission } from './entities/permission.entity';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { PolicyModule } from './policy.module';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission]),
    CacheModule.register(),
    forwardRef(() => PolicyModule),
  ],
  controllers: [PermissionController],
  providers: [
    {
      provide: `PERMISSION_${SERVICE_SUFFIX}`,
      useClass: PermissionService,
    },
    PolicyGuard,
  ],
  exports: [PermissionService, PolicyModule, PolicyGuard],
})
export class PermissionModule {}
