import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Policy } from './entities/policy.entity';
import { PolicyService } from './policy.service';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

const POLICY_SERVICE = `POLICY_${SERVICE_SUFFIX}`;

@Module({
  imports: [TypeOrmModule.forFeature([Policy]), CacheModule.register()],
  providers: [
    PolicyService,
    {
      provide: POLICY_SERVICE,
      useExisting: PolicyService,
    },
  ],
  exports: [PolicyService, POLICY_SERVICE],
})
export class PolicyModule {}
