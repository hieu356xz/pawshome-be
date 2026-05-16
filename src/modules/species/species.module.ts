import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Species } from './entities/species.entity';
import { SpeciesService } from './species.service';
import { SpeciesController } from './species.controller';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

const SPECIES_SERVICE = `SPECIES_${SERVICE_SUFFIX}`;

@Module({
  imports: [TypeOrmModule.forFeature([Species])],
  controllers: [SpeciesController],
  providers: [
    SpeciesService,
    {
      provide: SPECIES_SERVICE,
      useExisting: SpeciesService,
    },
  ],
  exports: [SpeciesService, SPECIES_SERVICE],
})
export class SpeciesModule {}
