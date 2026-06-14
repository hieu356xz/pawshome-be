import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, In } from 'typeorm';
import { PetPost } from './entities/pet-post.entity';
import { PetPostImage } from './entities/pet-post-image.entity';
import { PetPostComment } from './entities/pet-post-comment.entity';
import { EmbeddingService } from '@modules/embedding/embedding.service';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';
import { PetPostQueryDto } from './dto/post-query.dto';
import { PetPostSearchDto } from './dto/pet-post-search.dto';
import { CreatePetPostDto, UpdatePetPostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PostStatus } from './enums/post-status.enum';
import { BaseService } from '@/common/interfaces/base-service.interface';
import { StorageService } from '@common/services/storage.service';

export interface PetPostSearchResult {
  post: PetPost;
  similarityScore: number;
}

@Injectable()
export class PetPostService implements BaseService {
  private readonly logger = new Logger(PetPostService.name);

  constructor(
    @InjectRepository(PetPost)
    private postRepo: Repository<PetPost>,
    @InjectRepository(PetPostImage)
    private imageRepo: Repository<PetPostImage>,
    @InjectRepository(PetPostComment)
    private commentRepo: Repository<PetPostComment>,
    private embeddingService: EmbeddingService,
    private storageService: StorageService,
  ) {}

  async findAll(query: PetPostQueryDto): Promise<PaginatedResponse<PetPost>> {
    const {
      page,
      limit,
      postType,
      postStatus,
      location,
      search,
      userId,
      sortBy,
      sortOrder,
    } = query;

    const where: FindOptionsWhere<PetPost> = {};
    if (postType) where.postType = postType;
    if (postStatus) where.postStatus = postStatus;
    if (location) where.location = ILike(`%${location}%`);

    const queryBuilder = this.postRepo.createQueryBuilder('post');

    if (postType)
      queryBuilder.andWhere('post.postType = :postType', { postType });
    if (postStatus)
      queryBuilder.andWhere('post.postStatus = :postStatus', { postStatus });
    if (location)
      queryBuilder.andWhere('post.location ILIKE :location', {
        location: `%${location}%`,
      });
    if (userId)
      queryBuilder.andWhere('post.userId = :userId', { userId });

    if (search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (sortBy) {
      queryBuilder.orderBy(`post.${sortBy}`, sortOrder ?? 'ASC');
    } else {
      queryBuilder.orderBy('post.createdAt', 'DESC');
    }

    queryBuilder
      .leftJoinAndSelect('post.images', 'images')
      .leftJoinAndSelect('post.user', 'user')
      .take(limit)
      .skip((page - 1) * limit);

    const [results, total] = await queryBuilder.getManyAndCount();

    const meta: ResponseMeta = {
      totalItems: total,
      itemCount: results.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };

    return { results, meta };
  }

  async findOne(id: string): Promise<PetPost | null> {
    return this.postRepo.findOne({
      where: { id },
      relations: ['images', 'user'],
    });
  }

  async create(userId: string, data: CreatePetPostDto): Promise<PetPost> {
    const post = this.postRepo.create({
      userId,
      postType: data.postType,
      title: data.title,
      description: data.description,
      location: data.location,
      contact: data.contact,
      postStatus: PostStatus.ACTIVE,
    });
    return this.postRepo.save(post);
  }

  async update(id: string, data: UpdatePetPostDto): Promise<PetPost | null> {
    await this.postRepo.update(id, data);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: PostStatus): Promise<PetPost | null> {
    await this.postRepo.update(id, { postStatus: status });
    return this.findOne(id);
  }

  async remove(id: string, deletedBy: string): Promise<boolean> {
    await this.postRepo.update(id, { deletedAt: new Date(), deletedBy });
    return true;
  }

  async addImage(
    postId: string,
    file: Express.Multer.File,
  ): Promise<PetPostImage> {
    const existingImages = await this.imageRepo.count({ where: { postId } });
    if (existingImages >= 5) {
      throw new BadRequestException('Maximum 5 images per post');
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
        folder: 'pet-posts',
        fileName: `${postId}/${Date.now()}`,
      },
    );

    const image = this.imageRepo.create({
      postId,
      imageUrl,
      s3Key,
      embedding,
    });
    return this.imageRepo.save(image);
  }

  async getImages(postId: string): Promise<PetPostImage[]> {
    return this.imageRepo.find({ where: { postId } });
  }

  async deleteImage(id: string): Promise<boolean> {
    const image = await this.imageRepo.findOne({ where: { id } });
    if (image) {
      if (image.s3Key) {
        await this.storageService.deleteFile(image.s3Key);
      } else {
        await this.storageService.deleteFileWithUrl(image.imageUrl);
      }
    }
    const result = await this.imageRepo.delete(id);
    return !!result.affected;
  }

  async getComments(postId: string): Promise<PetPostComment[]> {
    return this.commentRepo.find({
      where: { postId },
      order: { createdAt: 'ASC' },
      relations: ['user', 'replies', 'replies.user'],
    });
  }

  async addComment(
    postId: string,
    userId: string,
    data: CreateCommentDto,
  ): Promise<PetPostComment> {
    const comment = this.commentRepo.create({
      postId,
      userId,
      parentId: data.parentId,
      content: data.content,
    });
    return this.commentRepo.save(comment);
  }

  async deleteComment(id: string, deletedBy: string): Promise<boolean> {
    await this.commentRepo.update(id, { deletedAt: new Date(), deletedBy });
    return true;
  }

  async updateComment(
    id: string,
    data: UpdateCommentDto,
  ): Promise<PetPostComment | null> {
    await this.commentRepo.update(id, { content: data.comment });
    return this.commentRepo.findOne({ where: { id } });
  }

  async search(
    imageBase64: string | undefined,
    imageMimeType: string | undefined,
    query: PetPostSearchDto,
  ): Promise<PaginatedResponse<PetPostSearchResult>> {
    const hasImage = !!imageBase64 && !!imageMimeType;
    const hasText = !!query.text;

    if (!hasImage && !hasText) {
      throw new BadRequestException('Either image or text must be provided');
    }

    const embedding = await this.embeddingService.embed({
      imageBase64: hasImage ? imageBase64 : undefined,
      imageMimeType: hasImage ? imageMimeType : undefined,
      text: hasText ? query.text : undefined,
    });

    const vectorStr = `[${embedding.join(',')}]`;
    const { page, limit, postType, postStatus, location } = query;

    const qb = this.postRepo
      .createQueryBuilder('post')
      .innerJoin('pet_post_images', 'pi', 'pi.post_id = post.id')
      .where('pi.embedding IS NOT NULL');

    if (postType) {
      qb.andWhere('post.post_type = :postType', { postType });
    }
    if (postStatus) {
      qb.andWhere('post.post_status = :postStatus', { postStatus });
    }
    if (location) {
      qb.andWhere('post.location ILIKE :location', {
        location: `%${location}%`,
      });
    }

    const total = await qb.clone().select('DISTINCT post.id').getCount();

    const rawResults = await qb
      .select([
        'post.id as id',
        `MAX(1 - (pi.embedding <=> '${vectorStr}'::vector)) as similarity`,
      ])
      .groupBy('post.id')
      .orderBy(`MAX(1 - (pi.embedding <=> '${vectorStr}'::vector))`, 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<{ id: string; similarity: number }>();

    const postIds = rawResults.map((r) => r.id);

    if (postIds.length === 0) {
      const meta: ResponseMeta = {
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: limit,
        totalPages: 0,
        currentPage: page,
      };
      return { results: [], meta };
    }

    const posts = await this.postRepo.find({
      where: { id: In(postIds) } as FindOptionsWhere<PetPost>,
      relations: ['images', 'user'],
    });

    const postMap = new Map(posts.map((p) => [p.id, p]));
    const similarityMap = new Map(rawResults.map((r) => [r.id, r.similarity]));

    const results: PetPostSearchResult[] = postIds
      .map((id) => {
        const post = postMap.get(id);
        if (!post) return null;
        return {
          post,
          similarityScore: similarityMap.get(id) ?? 0,
        };
      })
      .filter((r): r is PetPostSearchResult => r !== null);

    const meta: ResponseMeta = {
      totalItems: total,
      itemCount: results.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };

    return { results, meta };
  }

  async searchByImage(
    imageBase64: string,
    mimeType: string,
    limit = 10,
  ): Promise<PetPostImage[]> {
    this.logger.log(`Searching similar images by base64 (${mimeType})`);

    const embedding = await this.embeddingService.embed({
      imageBase64,
      imageMimeType: mimeType,
    });
    const vectorStr = `[${embedding.join(',')}]`;

    const results = await this.imageRepo
      .createQueryBuilder('pi')
      .select(['pi.id', 'pi.postId', 'pi.imageUrl', 'pi.createdAt'])
      .where('pi.embedding IS NOT NULL')
      .orderBy(`pi.embedding <=> '${vectorStr}'::vector`)
      .limit(limit)
      .getMany();

    this.logger.log(`Found ${results.length} similar images`);
    return results;
  }
}
