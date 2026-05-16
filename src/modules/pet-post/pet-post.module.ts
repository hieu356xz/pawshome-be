import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetPostService } from './pet-post.service';
import {
  PetPostController,
  PetPostImageController,
  PetPostCommentController,
  PetPostSearchController,
} from './pet-post.controller';
import { PetPost } from './entities/pet-post.entity';
import { PetPostImage } from './entities/pet-post-image.entity';
import { PetPostComment } from './entities/pet-post-comment.entity';
import { EmbeddingModule } from '@modules/embedding/embedding.module';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

const PETPOST_SERVICE = `PETPOST_${SERVICE_SUFFIX}`;

@Module({
  imports: [
    TypeOrmModule.forFeature([PetPost, PetPostImage, PetPostComment]),
    forwardRef(() => EmbeddingModule),
  ],
  controllers: [
    PetPostController,
    PetPostImageController,
    PetPostCommentController,
    PetPostSearchController,
  ],
  providers: [
    PetPostService,
    {
      provide: PETPOST_SERVICE,
      useExisting: PetPostService,
    },
  ],
  exports: [PetPostService, PETPOST_SERVICE],
})
export class PetPostModule {}
