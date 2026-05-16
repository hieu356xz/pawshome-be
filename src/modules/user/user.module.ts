import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [
    {
      provide: `USER_${SERVICE_SUFFIX}`,
      useClass: UserService,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
