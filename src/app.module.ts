import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '@modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: databaseConfig().type,
      host: databaseConfig().host,
      port: databaseConfig().port,
      username: databaseConfig().username,
      password: databaseConfig().password,
      entities: databaseConfig().entities,
      migrations: databaseConfig().migrations,
    }),
    UserModule,
    RoleModule,
    PermissionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
