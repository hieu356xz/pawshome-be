import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder, ILike } from 'typeorm';
import { Pet } from './entities/pet.entity';
import { PetQueryDto } from './dto/pet-query.dto';
import { Species } from '@modules/species/entities/species.entity';
import { Breed } from '@modules/breed/entities/breed.entity';
import { PetGender } from './enums/pet-gender.enum';
import { PetAgeGroup } from './enums/pet-age-group.enum';
import { AdoptionStatus } from './enums/adoption-status.enum';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';

type CreatePetData = {
  name: string;
  speciesId: number;
  breedId?: number | null;
  gender: PetGender;
  ageGroup: PetAgeGroup;
  color: string;
  weight?: number | null;
  description?: string | null;
  intakeDate: string | Date;
};

type UpdatePetData = {
  name?: string;
  speciesId?: number;
  breedId?: number | null;
  gender?: PetGender;
  ageGroup?: PetAgeGroup;
  color?: string;
  weight?: number | null;
  adoptionStatus?: AdoptionStatus;
  description?: string | null;
  intakeDate?: string | Date;
};

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet)
    private petRepo: Repository<Pet>,
  ) {}

  async findAll(query: PetQueryDto): Promise<PaginatedResponse<Pet>> {
    const {
      page,
      limit,
      speciesId,
      breedId,
      gender,
      ageGroup,
      adoptionStatus,
      color,
      sortBy,
      sortOrder,
    } = query;

    const where: FindOptionsWhere<Pet> = {};

    if (speciesId) {
      where.speciesId = speciesId;
    }
    if (breedId) {
      where.breedId = breedId;
    }
    if (gender) {
      where.gender = gender;
    }
    if (ageGroup) {
      where.ageGroup = ageGroup;
    }
    if (adoptionStatus) {
      where.adoptionStatus = adoptionStatus;
    }
    if (color) {
      where.color = ILike(`%${color}%`);
    }

    const order: FindOptionsOrder<Pet> = {};
    if (sortBy) {
      order[sortBy] = sortOrder ?? 'ASC';
    } else {
      order.createdAt = 'DESC';
    }

    const [results, total] = await this.petRepo.findAndCount({
      where,
      order,
      take: limit,
      skip: (page - 1) * limit,
      relations: ['species', 'breed'],
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

  async findOne(id: string): Promise<Pet | null> {
    const pet = await this.petRepo.findOne({
      where: { id },
      relations: ['species', 'breed'],
    });
    if (!pet) throw new NotFoundException(`Pet #${id} not found`);
    return pet;
  }

  async create(data: CreatePetData): Promise<Pet> {
    const speciesRepo = this.petRepo.manager.getRepository(Species);
    const speciesExists = await speciesRepo.exists({
      where: { id: data.speciesId },
    });
    if (!speciesExists) {
      throw new BadRequestException(`Species #${data.speciesId} not found`);
    }

    if (data.breedId) {
      const breedRepo = this.petRepo.manager.getRepository(Breed);
      const breedExists = await breedRepo.exists({
        where: { id: data.breedId },
      });
      if (!breedExists) {
        throw new BadRequestException(`Breed #${data.breedId} not found`);
      }
    }

    const petData = {
      ...data,
      intakeDate: new Date(data.intakeDate),
    };
    const pet = this.petRepo.create(petData);
    return this.petRepo.save(pet);
  }

  async update(id: string, data: UpdatePetData): Promise<Pet | null> {
    if (!(await this.isPetExist(id))) {
      throw new NotFoundException(`Pet #${id} not found`);
    }

    if (data.speciesId) {
      const speciesRepo = this.petRepo.manager.getRepository(Species);
      const speciesExists = await speciesRepo.exists({
        where: { id: data.speciesId },
      });
      if (!speciesExists) {
        throw new BadRequestException(`Species #${data.speciesId} not found`);
      }
    }

    if (data.breedId !== undefined) {
      if (data.breedId !== null) {
        const breedRepo = this.petRepo.manager.getRepository(Breed);
        const breedExists = await breedRepo.exists({
          where: { id: data.breedId },
        });
        if (!breedExists) {
          throw new BadRequestException(`Breed #${data.breedId} not found`);
        }
      }
    }

    await this.petRepo.update(id, data);
    return this.petRepo.findOne({
      where: { id },
      relations: ['species', 'breed'],
    });
  }

  async remove(id: string): Promise<boolean> {
    if (!(await this.isPetExist(id))) {
      throw new NotFoundException(`Pet #${id} not found`);
    }

    const result = await this.petRepo.delete(id);
    return !!result.affected;
  }

  protected async isPetExist(id: string) {
    return this.petRepo.exists({ where: { id } });
  }
}
