import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { Species } from './entities/species.entity';
import { SpeciesQueryDto } from './dto/species-query.dto';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';
import { BaseService } from '@/common/interfaces/base-service.interface';

@Injectable()
export class SpeciesService implements BaseService<Species> {
  constructor(
    @InjectRepository(Species)
    private speciesRepo: Repository<Species>,
  ) {}

  async findAll(query: SpeciesQueryDto): Promise<PaginatedResponse<Species>> {
    const { page, limit, name, sortBy, sortOrder } = query;

    const where: FindOptionsWhere<Species> = {};

    if (name) {
      where.name = name;
    }

    const order: FindOptionsOrder<Species> = {};
    if (sortBy) {
      order[sortBy] = sortOrder ?? 'ASC';
    }

    const [results, total] = await this.speciesRepo.findAndCount({
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

  async findOne(id: number): Promise<Species | null> {
    const species = await this.speciesRepo.findOne({
      where: { id },
    });
    if (!species) throw new NotFoundException(`Species #${id} not found`);
    return species;
  }

  async create(data: { name: string; description?: string }): Promise<Species> {
    const existing = await this.speciesRepo.findOne({
      where: { name: data.name },
    });
    if (existing) {
      throw new BadRequestException(`Species "${data.name}" already exists`);
    }
    const species = this.speciesRepo.create(data);
    return this.speciesRepo.save(species);
  }

  async update(id: number, data: Partial<Species>): Promise<Species | null> {
    if (!(await this.isSpeciesExist(id))) {
      throw new NotFoundException(`Species #${id} not found`);
    }

    if (data.name) {
      const existing = await this.speciesRepo.findOne({
        where: { name: data.name },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Species "${data.name}" already exists`);
      }
    }

    await this.speciesRepo.update(id, data);
    return this.speciesRepo.findOne({ where: { id } });
  }

  async remove(id: number): Promise<boolean> {
    if (!(await this.isSpeciesExist(id))) {
      throw new NotFoundException(`Species #${id} not found`);
    }

    const result = await this.speciesRepo.delete(id);
    return !!result.affected;
  }

  protected async isSpeciesExist(id: number) {
    return this.speciesRepo.exists({ where: { id } });
  }
}
