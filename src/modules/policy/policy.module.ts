import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Policy } from './entities/policy.entity';
import { PolicyService } from './policy.service';

@Module({
  imports: [TypeOrmModule.forFeature([Policy]), CacheModule.register()],
  providers: [PolicyService],
  exports: [PolicyService],
})
export class PolicyModule {}
