import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetImageService } from './pet-image.service';
import {
  PetImageController,
  ImageSearchController,
} from './pet-image.controller';
import { PetImage } from './entities/pet-image.entity';
import { EmbeddingModule } from '@modules/embedding/embedding.module';
import { PetService } from '../pet/pet.service';
import { PetModule } from '../pet/pet.module';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';
import { StorageService } from '@common/services/storage.service';

const PETIMAGE_SERVICE = `PETIMAGE_${SERVICE_SUFFIX}`;

@Module({
  imports: [
    TypeOrmModule.forFeature([PetImage]),
    EmbeddingModule,
    forwardRef(() => PetModule),
  ],
  controllers: [PetImageController, ImageSearchController],
  providers: [
    PetImageService,
    PetService,
    StorageService,
    {
      provide: PETIMAGE_SERVICE,
      useExisting: PetImageService,
    },
  ],
  exports: [PetImageService, PETIMAGE_SERVICE],
})
export class PetImageModule {}
