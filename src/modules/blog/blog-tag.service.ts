import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import slugify from 'slugify';
import { Tag } from './entities/tag.entity';
import { CreateBlogTagDto, UpdateBlogTagDto } from './dto/blog-tag.dto';

@Injectable()
export class BlogTagService {
  constructor(
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
  ) {}

  private slugify(text: string): string {
    return slugify(text, { lower: true, locale: 'vi' });
  }

  async findAll(): Promise<Tag[]> {
    return this.tagRepo.find({ order: { name: 'ASC' } });
  }

  async findByIds(ids: number[]): Promise<Tag[]> {
    return this.tagRepo.findBy({ id: In(ids) });
  }

  async findOne(id: number): Promise<Tag> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
  }

  async create(data: CreateBlogTagDto): Promise<Tag> {
    const slug = this.slugify(data.name);
    const existing = await this.tagRepo.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Tag with this name already exists');
    }

    const tag = this.tagRepo.create({
      name: data.name,
      slug,
    });
    return this.tagRepo.save(tag);
  }

  async update(id: number, data: UpdateBlogTagDto): Promise<Tag> {
    const tag = await this.findOne(id);
    const slug = this.slugify(data.name);

    if (tag.slug !== slug) {
      const existing = await this.tagRepo.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Tag with this name already exists');
      }
    }

    tag.name = data.name;
    tag.slug = slug;
    return this.tagRepo.save(tag);
  }

  async remove(id: number): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagRepo.remove(tag);
  }
}
