import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { S3ServiceException } from '@aws-sdk/client-s3';
import * as cheerio from 'cheerio';
import slugify from 'slugify';
import { BlogPost } from './entities/blog-post.entity';
import { BlogPostComment } from './entities/blog-post-comment.entity';
import { Tag } from './entities/tag.entity';
import { StorageService } from '@common/services/storage.service';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';
import { BlogPostQueryDto } from './dto/blog-post-query.dto';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
} from './dto/create-blog-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { BlogPostStatus } from './enums/blog-post-status.enum';

@Injectable()
export class BlogPostService {
  private readonly logger = new Logger(BlogPostService.name);

  constructor(
    @InjectRepository(BlogPost)
    private postRepo: Repository<BlogPost>,
    @InjectRepository(BlogPostComment)
    private commentRepo: Repository<BlogPostComment>,
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
    private storageService: StorageService,
  ) {}

  private slugify(text: string): string {
    return slugify(text, { lower: true, locale: 'vi' });
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.slugify(title);
    const now = new Date();
    const dateSlug = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const timestamp = Date.now().toString().slice(-4);
    let slug = `${baseSlug}-${dateSlug}-${timestamp}`;

    while (true) {
      const existing = await this.postRepo.findOne({ where: { slug } });
      if (!existing) break;
      const newTimestamp = Date.now().toString().slice(-4);
      slug = `${baseSlug}-${dateSlug}-${newTimestamp}`;
    }

    return slug;
  }

  private generateExcerpt(content: string): string {
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (plainText.length <= 200) return plainText;
    return plainText.substring(0, 197) + '...';
  }

  private async processContentImages(
    htmlContent: string,
    postId: string,
  ): Promise<string> {
    const $ = cheerio.load(htmlContent, { xmlMode: true });
    const images = $('img[src^="data:image"]');

    for (const img of images) {
      const src = img.attribs?.src;
      if (!src) continue;

      const match = src.match(/^data:image\/([^;]+);base64,(.+)$/);
      if (!match) continue;

      const mimeType = `image/${match[1]}`;
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      try {
        const url = await this.storageService.uploadFile(buffer, mimeType, {
          folder: 'blog',
          fileName: `${postId}-${Date.now()}`,
        });
        $(img).attr('src', url);
      } catch (error) {
        const message =
          error instanceof S3ServiceException ? error.message : 'Unknown error';
        this.logger.error(`Failed to upload image: ${message}`);
      }
    }

    return $.html();
  }

  async findAll(query: BlogPostQueryDto): Promise<PaginatedResponse<BlogPost>> {
    const { page, limit, search, tagId } = query;

    const queryBuilder = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.tags', 'tag');

    queryBuilder.where('post.status = :status', {
      status: BlogPostStatus.PUBLISHED,
    });

    if (search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (tagId) {
      queryBuilder.andWhere('tag.id = :tagId', { tagId });
    }

    queryBuilder
      .orderBy('post.createdAt', 'DESC')
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

  async findOne(id: string): Promise<BlogPost | null> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['tags'],
    });

    if (post) {
      await this.postRepo.increment({ id }, 'viewCount', 1);
    }

    return post;
  }

  async findBySlug(slug: string): Promise<BlogPost | null> {
    const post = await this.postRepo.findOne({
      where: { slug, status: BlogPostStatus.PUBLISHED },
      relations: ['tags'],
    });

    if (post) {
      await this.postRepo.increment({ id: post.id }, 'viewCount', 1);
    }

    return post;
  }

  async create(userId: string, data: CreateBlogPostDto): Promise<BlogPost> {
    const slug = await this.generateUniqueSlug(data.title);

    let content = data.content;
    if (content.includes('data:image')) {
      content = await this.processContentImages(content, 'new-' + Date.now());
    }

    const excerpt = data.excerpt || this.generateExcerpt(content);

    const post = this.postRepo.create({
      userId,
      title: data.title,
      slug,
      content,
      excerpt,
      status: data.status || BlogPostStatus.DRAFT,
    });

    const savedPost = await this.postRepo.save(post);

    if (data.tagIds?.length) {
      const tags = await this.tagRepo.findBy({ id: In(data.tagIds) });
      savedPost.tags = tags;
      await this.postRepo.save(savedPost);
    }

    return savedPost;
  }

  async update(id: string, data: UpdateBlogPostDto): Promise<BlogPost | null> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) return null;

    if (data.title && data.title !== post.title) {
      post.slug = await this.generateUniqueSlug(data.title);
    }

    if (data.content) {
      let content = data.content;
      if (content.includes('data:image')) {
        content = await this.processContentImages(content, id);
      }
      post.content = content;
      if (!data.excerpt) {
        post.excerpt = this.generateExcerpt(content);
      }
    }

    if (data.excerpt) post.excerpt = data.excerpt;
    if (data.status) post.status = data.status;

    await this.postRepo.save(post);
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) return false;

    if (post.featuredImageUrl) {
      try {
        await this.storageService.deleteFile(post.featuredImageUrl);
      } catch (error) {
        const message =
          error instanceof S3ServiceException ? error.message : 'Unknown error';
        this.logger.error(`Failed to delete featured image: ${message}`);
      }
    }

    await this.postRepo.update(id, {
      deletedAt: new Date(),
      deletedBy: userId,
    });

    return true;
  }

  async updateTags(id: string, tagIds: number[]): Promise<BlogPost | null> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) return null;

    const tags = await this.tagRepo.findBy({ id: In(tagIds) });
    post.tags = tags;
    await this.postRepo.save(post);

    return this.findOne(id);
  }

  async uploadFeaturedImage(
    id: string,
    file: Express.Multer.File,
  ): Promise<BlogPost | null> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) return null;

    const url = await this.storageService.uploadFile(
      file.buffer,
      file.mimetype,
      {
        folder: 'blog',
        fileName: `featured-${id}`,
      },
    );

    await this.postRepo.update(id, { featuredImageUrl: url });
    return this.findOne(id);
  }

  async removeFeaturedImage(id: string): Promise<boolean> {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post || !post.featuredImageUrl) return false;

    await this.storageService.deleteFile(post.featuredImageUrl);
    await this.postRepo.update(id, { featuredImageUrl: null });
    return true;
  }

  async getTags(): Promise<Tag[]> {
    return this.tagRepo.find({ order: { name: 'ASC' } });
  }

  async createTag(name: string): Promise<Tag> {
    const slug = this.slugify(name);
    const existing = await this.tagRepo.findOne({ where: { slug } });
    if (existing) return existing;

    const tag = this.tagRepo.create({ name, slug });
    return this.tagRepo.save(tag);
  }

  async getComments(postId: string): Promise<BlogPostComment[]> {
    return this.commentRepo.find({
      where: { blogPostId: postId, isApproved: true },
      relations: ['user', 'replies'],
      order: { createdAt: 'DESC' },
    });
  }

  async addComment(
    postId: string,
    userId: string,
    data: CreateCommentDto,
  ): Promise<BlogPostComment> {
    const comment = this.commentRepo.create({
      blogPostId: postId,
      userId,
      parentId: data.parentId || null,
      content: data.content,
      isApproved: false,
    });
    return this.commentRepo.save(comment);
  }

  async updateComment(
    id: string,
    userId: string,
    data: UpdateCommentDto,
  ): Promise<BlogPostComment | null> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment || comment.userId !== userId) return null;

    await this.commentRepo.update(id, { content: data.content });
    return this.commentRepo.findOne({ where: { id } });
  }

  async deleteComment(id: string, userId: string): Promise<boolean> {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment || comment.userId !== userId) return false;

    await this.commentRepo.update(id, {
      deletedAt: new Date(),
      deletedBy: userId,
    });
    return true;
  }
}
