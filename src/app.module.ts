import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { UserModule } from '@modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { AuthModule } from './modules/auth/auth.module';
import { SpeciesModule } from './modules/species/species.module';
import { BreedModule } from './modules/breed/breed.module';
import { PetModule } from './modules/pet/pet.module';
import { PetImageModule } from './modules/pet-image/pet-image.module';
import { MedicalRecordModule } from './modules/medical-record/medical-record.module';
import { AdoptionRequestModule } from './modules/adoption-request/adoption-request.module';
import { PetPostModule } from './modules/pet-post/pet-post.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig() as TypeOrmModuleOptions),
    CacheModule.register({
      isGlobal: true,
      ttl: 600000, // 10 minutes
      max: 100, // Maximum number of items in cache
    }),
    UserModule,
    RoleModule,
    PermissionModule,
    AuthModule,
    SpeciesModule,
    BreedModule,
    PetModule,
    PetImageModule,
    MedicalRecordModule,
    AdoptionRequestModule,
    PetPostModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
