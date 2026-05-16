import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { PetService } from './pet.service';
import { PetController } from './pet.controller';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';
import { EmbeddingModule } from '@modules/embedding/embedding.module';

const PET_SERVICE = `PET_${SERVICE_SUFFIX}`;

@Module({
  imports: [TypeOrmModule.forFeature([Pet]), EmbeddingModule],
  controllers: [PetController],
  providers: [
    PetService,
    {
      provide: PET_SERVICE,
      useExisting: PetService,
    },
  ],
  exports: [TypeOrmModule, PET_SERVICE],
})
export class PetModule {}
