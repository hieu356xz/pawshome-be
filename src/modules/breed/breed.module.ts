import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Breed } from './entities/breed.entity';
import { BreedService } from './breed.service';
import { BreedController } from './breed.controller';
import { SpeciesModule } from '@modules/species/species.module';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

const BREED_SERVICE = `BREED_${SERVICE_SUFFIX}`;

@Module({
  imports: [TypeOrmModule.forFeature([Breed]), SpeciesModule],
  controllers: [BreedController],
  providers: [
    BreedService,
    {
      provide: BREED_SERVICE,
      useExisting: BreedService,
    },
  ],
  exports: [TypeOrmModule, BREED_SERVICE],
})
export class BreedModule {}
