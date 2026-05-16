import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { Breed } from './entities/breed.entity';
import { BreedQueryDto } from './dto/breed-query.dto';
import { Species } from '@modules/species/entities/species.entity';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';
import { BaseService } from '@/common/interfaces/base-service.interface';

@Injectable()
export class BreedService implements BaseService<Breed> {
  constructor(
    @InjectRepository(Breed)
    private breedRepo: Repository<Breed>,
  ) {}

  async findAll(query: BreedQueryDto): Promise<PaginatedResponse<Breed>> {
    const { page, limit, speciesId, name, sortBy, sortOrder } = query;

    const where: FindOptionsWhere<Breed> = {};

    if (speciesId) {
      where.speciesId = speciesId;
    }

    if (name) {
      where.name = name;
    }

    const order: FindOptionsOrder<Breed> = {};
    if (sortBy) {
      order[sortBy] = sortOrder ?? 'ASC';
    } else {
      order.id = 'ASC';
    }

    const [results, total] = await this.breedRepo.findAndCount({
      where,
      order,
      take: limit,
      skip: (page - 1) * limit,
      relations: ['species'],
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

  async findOne(id: number): Promise<Breed | null> {
    const breed = await this.breedRepo.findOne({
      where: { id },
      relations: ['species'],
    });
    if (!breed) throw new NotFoundException(`Breed #${id} not found`);
    return breed;
  }

  async create(data: {
    speciesId: number;
    name: string;
    description?: string;
  }): Promise<Breed> {
    const speciesRepo = this.breedRepo.manager.getRepository(Species);
    const speciesExists = await speciesRepo.exists({
      where: { id: data.speciesId },
    });
    if (!speciesExists) {
      throw new BadRequestException(`Species #${data.speciesId} not found`);
    }

    const existing = await this.breedRepo.findOne({
      where: { speciesId: data.speciesId, name: data.name },
    });
    if (existing) {
      throw new BadRequestException(
        `Breed "${data.name}" already exists for species #${data.speciesId}`,
      );
    }

    const breed = this.breedRepo.create(data);
    return this.breedRepo.save(breed);
  }

  async update(id: number, data: Partial<Breed>): Promise<Breed | null> {
    if (!(await this.isBreedExist(id))) {
      throw new NotFoundException(`Breed #${id} not found`);
    }

    if (data.speciesId) {
      const speciesRepo = this.breedRepo.manager.getRepository(Species);
      const speciesExists = await speciesRepo.exists({
        where: { id: data.speciesId },
      });
      if (!speciesExists) {
        throw new BadRequestException(`Species #${data.speciesId} not found`);
      }
    }

    if (data.name && data.speciesId) {
      const existing = await this.breedRepo.findOne({
        where: { speciesId: data.speciesId, name: data.name },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Breed "${data.name}" already exists for species #${data.speciesId}`,
        );
      }
    }

    await this.breedRepo.update(id, data);
    return this.breedRepo.findOne({
      where: { id },
      relations: ['species'],
    });
  }

  async remove(id: number): Promise<boolean> {
    if (!(await this.isBreedExist(id))) {
      throw new NotFoundException(`Breed #${id} not found`);
    }

    const result = await this.breedRepo.delete(id);
    return !!result.affected;
  }

  protected async isBreedExist(id: number) {
    return this.breedRepo.exists({ where: { id } });
  }
}
