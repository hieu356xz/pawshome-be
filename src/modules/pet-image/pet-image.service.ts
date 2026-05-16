import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PetImage } from './entities/pet-image.entity';
import { EmbeddingService } from '@modules/embedding/embedding.service';

export interface Base64Image {
  mimeType: string;
  data: string;
}

@Injectable()
export class PetImageService {
  private readonly logger = new Logger(PetImageService.name);

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
    const embedding = await this.embeddingService.embed({
      imageBase64: base64,
      imageMimeType: mimeType,
    });

    const existingImages = await this.imageRepo.count({ where: { petId } });
    const isPrimary = existingImages === 0;

    const image = this.imageRepo.create({
      petId,
      embedding,
      isPrimary,
    });
    return this.imageRepo.save(image);
  }

  async createFromUrl(petId: string, imageUrl: string): Promise<PetImage> {
    this.logger.log(`Fetching image from URL: ${imageUrl}`);
    const image = await this.fetchImageAsBase64(imageUrl);
    const embedding = await this.embeddingService.embed({
      imageBase64: image.data,
      imageMimeType: image.mimeType,
    });

    const existingImages = await this.imageRepo.count({ where: { petId } });
    const isPrimary = existingImages === 0;

    const imageEntity = this.imageRepo.create({
      petId,
      imageUrl,
      embedding,
      isPrimary,
    });
    return this.imageRepo.save(imageEntity);
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

  async searchByText(text: string, limit = 10): Promise<PetImage[]> {
    this.logger.log(`Searching images by text: "${text}"`);

    const embedding = await this.embeddingService.embed({ text });
    const vectorStr = `[${embedding.join(',')}]`;

    const results = await this.imageRepo
      .createQueryBuilder('pi')
      .select([
        'pi.id',
        'pi.petId',
        'pi.imageUrl',
        'pi.isPrimary',
        'pi.createdAt',
        'pi.embedding',
      ])
      .where('pi.embedding IS NOT NULL')
      .orderBy(`pi.embedding <=> '${vectorStr}'::vector`)
      .limit(limit)
      .getMany();

    this.logger.log(`Found ${results.length} images`);
    return results;
  }

  async searchSimilarImages(
    base64: string,
    mimeType: string,
    limit = 10,
  ): Promise<PetImage[]> {
    this.logger.log(`Searching similar images by base64 (${mimeType})`);

    const embedding = await this.embeddingService.embed({
      imageBase64: base64,
      imageMimeType: mimeType,
    });
    const vectorStr = `[${embedding.join(',')}]`;

    const results = await this.imageRepo
      .createQueryBuilder('pi')
      .select([
        'pi.id',
        'pi.petId',
        'pi.imageUrl',
        'pi.isPrimary',
        'pi.createdAt',
      ])
      .where('pi.embedding IS NOT NULL')
      .orderBy(`pi.embedding <=> '${vectorStr}'::vector`)
      .limit(limit)
      .getMany();

    this.logger.log(`Found ${results.length} similar images`);
    return results;
  }

  async searchByImageAndText(
    imageBase64?: string,
    imageMimeType?: string,
    queryText?: string,
    limit = 10,
  ): Promise<PetImage[]> {
    this.logger.log(
      `Searching images - image: ${!!imageBase64}, text: ${!!queryText}`,
    );

    const hasImage = !!imageBase64 && !!imageMimeType;
    const hasText = !!queryText;

    if (!hasImage && !hasText) {
      return [];
    }

    const embedding = await this.embeddingService.embed({
      imageBase64: hasImage ? imageBase64 : undefined,
      imageMimeType: hasImage ? imageMimeType : undefined,
      text: hasText ? queryText : undefined,
    });

    const vectorStr = `[${embedding.join(',')}]`;

    const results = await this.imageRepo
      .createQueryBuilder('pi')
      .select([
        'pi.id',
        'pi.petId',
        'pi.imageUrl',
        'pi.isPrimary',
        'pi.createdAt',
      ])
      .where('pi.embedding IS NOT NULL')
      .orderBy(`pi.embedding <=> '${vectorStr}'::vector`)
      .limit(limit)
      .getMany();

    this.logger.log(`Found ${results.length} images`);
    return results;
  }

  private async fetchImageAsBase64(imageUrl: string): Promise<Base64Image> {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    const mimeTypeMap: Record<string, string> = {
      'image/jpeg': 'image/jpeg',
      'image/jpg': 'image/jpeg',
      'image/png': 'image/png',
      'image/webp': 'image/webp',
    };
    const mimeType = mimeTypeMap[contentType] ?? 'image/jpeg';

    return {
      mimeType,
      data: buffer.toString('base64'),
    };
  }
}
