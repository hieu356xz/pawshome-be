import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

const USER_SERVICE = `USER_${SERVICE_SUFFIX}`;

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, { provide: USER_SERVICE, useExisting: UserService }],
  exports: [UserService, USER_SERVICE],
})
export class UserModule {}
