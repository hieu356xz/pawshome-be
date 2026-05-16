import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Permission } from './entities/permission.entity';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { PolicyModule } from './policy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission]),
    CacheModule.register(),
    forwardRef(() => PolicyModule),
  ],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService, PolicyModule],
})
export class PermissionModule {}
