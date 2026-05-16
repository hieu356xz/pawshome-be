import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder, ILike } from 'typeorm';
import { PetPost } from './entities/pet-post.entity';
import { PetPostImage } from './entities/pet-post-image.entity';
import { PetPostComment } from './entities/pet-post-comment.entity';
import { EmbeddingService } from '@modules/embedding/embedding.service';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';
import { PetPostQueryDto } from './dto/post-query.dto';
import { CreatePetPostDto, UpdatePetPostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PostStatus } from './enums/post-status.enum';
import { BaseService } from '@/common/interfaces/base-service.interface';

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
  ) {}

  async findAll(query: PetPostQueryDto): Promise<PaginatedResponse<PetPost>> {
    const { page, limit, postType, postStatus, location, search } = query;

    const where: FindOptionsWhere<PetPost> = {};
    if (postType) where.postType = postType;
    if (postStatus) where.postStatus = postStatus;
    if (location) where.location = ILike(`%${location}%`);

    const order: FindOptionsOrder<PetPost> = { createdAt: 'DESC' };

    const [results, total] = await this.postRepo.findAndCount({
      where,
      order,
      take: limit,
      skip: (page - 1) * limit,
    });

    let filteredResults = results;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResults = results.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          (post.description?.toLowerCase().includes(searchLower) ?? false),
      );
    }

    const meta: ResponseMeta = {
      totalItems: total,
      itemCount: filteredResults.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };

    return { results: filteredResults, meta };
  }

  async findOne(id: string): Promise<PetPost | null> {
    return this.postRepo.findOne({ where: { id } });
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

  async remove(id: string, userId: string): Promise<boolean> {
    await this.postRepo.update(id, {
      deletedAt: new Date(),
      deletedBy: userId,
    });
    return true;
  }

  async addImage(
    postId: string,
    imageBase64: string,
    mimeType: string,
  ): Promise<PetPostImage> {
    const existingImages = await this.imageRepo.count({ where: { postId } });
    if (existingImages >= 5) {
      throw new BadRequestException('Maximum 5 images per post');
    }

    const embedding = await this.embeddingService.embed({
      imageBase64,
      imageMimeType: mimeType,
    });

    const image = this.imageRepo.create({
      postId,
      embedding,
    });
    return this.imageRepo.save(image);
  }

  async getImages(postId: string): Promise<PetPostImage[]> {
    return this.imageRepo.find({ where: { postId } });
  }

  async deleteImage(id: string): Promise<boolean> {
    const result = await this.imageRepo.delete(id);
    return !!result.affected;
  }

  async getComments(postId: string): Promise<PetPostComment[]> {
    return this.commentRepo.find({
      where: { postId },
      order: { createdAt: 'ASC' },
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
      comment: data.comment,
    });
    return this.commentRepo.save(comment);
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    await this.commentRepo.update(id, {
      deletedAt: new Date(),
      deletedBy: userId,
    });
    return true;
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
