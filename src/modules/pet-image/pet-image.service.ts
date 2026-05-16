import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PetImage } from './entities/pet-image.entity';
import {
  EmbeddingService,
  Base64Image,
} from '@modules/embedding/embedding.service';

@Injectable()
export class PetImageService {
  constructor(
    @InjectRepository(PetImage)
    private imageRepo: Repository<PetImage>,
    private embeddingService: EmbeddingService,
  ) {}

  async findByPetId(petId: string): Promise<PetImage[]> {
    return this.imageRepo.find({
      where: { petId },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PetImage> {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image) throw new NotFoundException(`PetImage #${id} not found`);
    return image;
  }

  async create(
    petId: string,
    base64: string,
    mimeType: string,
  ): Promise<PetImage> {
    const imageData: Base64Image = { mimeType, data: base64 };
    const embedding =
      await this.embeddingService.embedImageFromBase64(imageData);

    const existingImages = await this.imageRepo.count({ where: { petId } });
    const isPrimary = existingImages === 0;

    // imageUrl will be set after uploaded to storage
    const image = this.imageRepo.create({
      petId,
      embedding,
      isPrimary,
    });
    return this.imageRepo.save(image);
  }

  async createFromUrl(petId: string, imageUrl: string): Promise<PetImage> {
    const embedding = await this.embeddingService.embedImageFromUrl(imageUrl);

    const existingImages = await this.imageRepo.count({ where: { petId } });
    const isPrimary = existingImages === 0;

    const image = this.imageRepo.create({
      petId,
      imageUrl,
      embedding,
      isPrimary,
    });
    return this.imageRepo.save(image);
  }

  async setPrimary(id: string, petId: string): Promise<PetImage> {
    await this.imageRepo.update(
      { petId, isPrimary: true },
      { isPrimary: false },
    );

    await this.imageRepo.update(id, { isPrimary: true });
    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.imageRepo.delete(id);
    return !!result.affected;
  }
}
