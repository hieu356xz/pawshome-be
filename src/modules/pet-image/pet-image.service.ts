import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { PetImage } from './entities/pet-image.entity';
import { EmbeddingService } from '@modules/embedding/embedding.service';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';
import { PetImageQueryDto } from './dto/pet-image-query.dto';
import { PetImageResponseDto } from './dto/pet-image-response.dto';
import { PetService } from '../pet/pet.service';
import { StorageService } from '@common/services/storage.service';
import { IMAGE_MIME_TYPES } from '@/common/constants/file.constants';

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
    @Inject(forwardRef(() => PetService))
    private petService: PetService,
    private embeddingService: EmbeddingService,
    private storageService: StorageService,
  ) {}

  private async isPetExist(id: string): Promise<boolean> {
    return this.petService.isPetExist(id);
  }

  private async isPetImageExist(id: string): Promise<boolean> {
    return this.imageRepo.exists({ where: { id } });
  }

  async findAll(query: PetImageQueryDto): Promise<PaginatedResponse<PetImage>> {
    const { page, limit, isPrimary, petId } = query;

    if (petId && !(await this.isPetExist(petId))) {
      throw new NotFoundException(`Pet #${petId} does not exist`);
    }

    const where: FindOptionsWhere<PetImage> = {};
    if (petId) {
      where.petId = petId;
    }
    if (isPrimary !== undefined) {
      where.isPrimary = isPrimary;
    }

    const order: FindOptionsOrder<PetImage> = {
      isPrimary: 'DESC',
      createdAt: 'DESC',
    };

    const [results, total] = await this.imageRepo.findAndCount({
      where,
      order,
      take: limit,
      skip: (page - 1) * limit,
    });

    const meta: ResponseMeta = {
      totalItems: total,
      itemCount: results.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };

    return { results, meta };
  }

  async findByPetId(petId: string): Promise<PetImage[]> {
    return this.imageRepo.find({
      where: { petId },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PetImage> {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (!image) throw new NotFoundException(`PetImage #${id} does not exist`);
    return image;
  }

  async create(petId: string, file: Express.Multer.File): Promise<PetImage> {
    if (!(await this.isPetExist(petId))) {
      throw new NotFoundException(`Pet #${petId} does not exist`);
    }

    const base64 = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    const embedding = await this.embeddingService.embed({
      imageBase64: base64,
      imageMimeType: mimeType,
    });

    const { url: imageUrl, key: s3Key } = await this.storageService.uploadFile(
      file.buffer,
      mimeType,
      {
        folder: 'pet-images',
        fileName: `${petId}/${Date.now()}`,
      },
    );

    const existingImages = await this.imageRepo.count({ where: { petId } });
    const isPrimary = existingImages === 0;

    const image = this.imageRepo.create({
      petId,
      imageUrl,
      s3Key,
      embedding,
      isPrimary,
    });
    return this.imageRepo.save(image);
  }

  async createFromUrl(petId: string, externalUrl: string): Promise<PetImage> {
    if (!(await this.isPetExist(petId))) {
      throw new NotFoundException(`Pet #${petId} does not exist`);
    }

    this.logger.log(`Fetching image from URL: ${externalUrl}`);
    const image = await this.fetchImageAsBase64(externalUrl);

    const embedding = await this.embeddingService.embed({
      imageBase64: image.data,
      imageMimeType: image.mimeType,
    });

    const buffer = Buffer.from(image.data, 'base64');
    const { url: imageUrl, key: s3Key } = await this.storageService.uploadFile(
      buffer,
      image.mimeType,
      {
        folder: 'pet-images',
        fileName: `${petId}/${Date.now()}`,
      },
    );

    const existingImages = await this.imageRepo.count({ where: { petId } });
    const isPrimary = existingImages === 0;

    const imageEntity = this.imageRepo.create({
      petId,
      imageUrl,
      s3Key,
      embedding,
      isPrimary,
    });
    return this.imageRepo.save(imageEntity);
  }

  async setPrimary(id: string): Promise<PetImage> {
    if (!(await this.isPetImageExist(id))) {
      throw new NotFoundException(`PetImage #${id} does not exist`);
    }
    const image = await this.findOne(id);
    if (!(await this.isPetExist(image.petId))) {
      throw new NotFoundException(`Pet #${image.petId} does not exist`);
    }

    await this.imageRepo.update(
      { petId: image.petId, isPrimary: true },
      { isPrimary: false },
    );

    await this.imageRepo.update(id, { isPrimary: true });
    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    if (!(await this.isPetImageExist(id))) {
      throw new NotFoundException(`PetImage #${id} does not exist`);
    }
    const image = await this.findOne(id);
    if (!(await this.isPetExist(image.petId))) {
      throw new NotFoundException(`Pet #${image.petId} does not exist`);
    }

    if (image.s3Key) {
      await this.storageService.deleteFile(image.s3Key);
    } else {
      await this.storageService.deleteFileWithUrl(image.imageUrl);
    }
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
    const mimeType = IMAGE_MIME_TYPES.includes(
      contentType as (typeof IMAGE_MIME_TYPES)[number],
    )
      ? contentType
      : 'image/jpeg';

    return {
      mimeType,
      data: buffer.toString('base64'),
    };
  }

  toResponseWithEmbedding(image: PetImage): PetImageResponseDto {
    return plainToInstance(PetImageResponseDto, image, {
      excludeExtraneousValues: false,
    });
  }

  toResponsesWithEmbedding(images: PetImage[]): PetImageResponseDto[] {
    return images.map((img) => this.toResponseWithEmbedding(img));
  }
}
