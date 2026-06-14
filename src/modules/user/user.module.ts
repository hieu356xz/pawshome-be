import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { ProfileController } from './profile.controller';
import { UserService } from './user.service';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';
import { StorageService } from '@common/services/storage.service';

const USER_SERVICE = `USER_${SERVICE_SUFFIX}`;

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController, ProfileController],
  providers: [
    UserService,
    StorageService,
    { provide: USER_SERVICE, useExisting: UserService },
  ],
  exports: [UserService, USER_SERVICE],
})
export class UserModule {}
