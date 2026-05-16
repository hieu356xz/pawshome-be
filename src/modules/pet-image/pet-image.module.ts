import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetImageService } from './pet-image.service';
import { PetImageController } from './pet-image.controller';
import { PetImage } from './entities/pet-image.entity';
import { EmbeddingModule } from '@modules/embedding/embedding.module';

@Module({
  imports: [TypeOrmModule.forFeature([PetImage]), EmbeddingModule],
  controllers: [PetImageController],
  providers: [PetImageService],
  exports: [PetImageService],
})
export class PetImageModule {}
