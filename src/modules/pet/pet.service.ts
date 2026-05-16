import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  FindOptionsOrder,
  ILike,
  In,
} from 'typeorm';
import { Pet } from './entities/pet.entity';
import { PetQueryDto } from './dto/pet-query.dto';
import { PetSearchDto } from './dto/pet-search.dto';
import { Species } from '@modules/species/entities/species.entity';
import { Breed } from '@modules/breed/entities/breed.entity';
import { PetGender } from './enums/pet-gender.enum';
import { PetAgeGroup } from './enums/pet-age-group.enum';
import { AdoptionStatus } from './enums/adoption-status.enum';
import { EmbeddingService } from '@modules/embedding/embedding.service';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';

export interface PetSearchResult {
  pet: Pet;
  similarityScore: number;
}

type CreatePetData = {
  name: string;
  speciesId: number;
  breedId?: number | null;
  gender: PetGender;
  ageGroup: PetAgeGroup;
  color: string;
  weight?: number | null;
  description?: string | null;
  isVaccinated?: boolean;
  isNeutered?: boolean;
  healthSummary?: string | null;
  intakeDate: string | Date;
  petCode?: string;
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
  isVaccinated?: boolean;
  isNeutered?: boolean;
  healthSummary?: string | null;
  intakeDate?: string | Date;
  petCode?: string;
};

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet)
    private petRepo: Repository<Pet>,
    private embeddingService: EmbeddingService,
  ) {}

  async findAll(query: PetQueryDto): Promise<PaginatedResponse<Pet>> {
    const {
      page,
      limit,
      petCode,
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

    if (petCode) {
      where.petCode = petCode;
    }
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
      relations: ['species', 'breed', 'images'],
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
      relations: ['species', 'breed', 'images'],
    });
    if (!pet) throw new NotFoundException(`Pet #${id} not found`);
    return pet;
  }

  async findOneByPetCode(petCode: string): Promise<Pet | null> {
    const pet = await this.petRepo.findOne({
      where: { petCode },
      relations: ['species', 'breed', 'images'],
    });
    if (!pet)
      throw new NotFoundException(`Pet with code "${petCode}" not found`);
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

    const petCode = data.petCode ?? (await this.generatePetCode());

    const petData = {
      ...data,
      petCode,
      intakeDate: new Date(data.intakeDate),
    };
    const pet = this.petRepo.create(petData);
    return this.petRepo.save(pet);
  }

  async generatePetCode(): Promise<string> {
    const lastPet = await this.petRepo.findOne({
      where: {},
      order: { id: 'DESC' },
      select: ['petCode'],
    });

    let nextNumber = 1;
    if (lastPet?.petCode) {
      const match = lastPet.petCode.match(/PSH-PET-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const paddedNumber = nextNumber.toString().padStart(4, '0');
    return `PSH-PET-${paddedNumber}`;
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
      relations: ['species', 'breed', 'images'],
    });
  }

  async remove(id: string): Promise<boolean> {
    if (!(await this.isPetExist(id))) {
      throw new NotFoundException(`Pet #${id} not found`);
    }

    const result = await this.petRepo.delete(id);
    return !!result.affected;
  }

  public async isPetExist(id: string) {
    return this.petRepo.exists({ where: { id } });
  }

  async search(
    imageBase64: string | undefined,
    imageMimeType: string | undefined,
    query: PetSearchDto,
  ): Promise<PaginatedResponse<PetSearchResult>> {
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
    const {
      page,
      limit,
      speciesId,
      breedId,
      gender,
      ageGroup,
      adoptionStatus,
    } = query;

    const qb = this.petRepo
      .createQueryBuilder('pet')
      .innerJoin('pet_images', 'pi', 'pi.pet_id = pet.id')
      .where('pi.embedding IS NOT NULL');

    if (speciesId) {
      qb.andWhere('pet.species_id = :speciesId', { speciesId });
    }
    if (breedId) {
      qb.andWhere('pet.breed_id = :breedId', { breedId });
    }
    if (gender) {
      qb.andWhere('pet.gender = :gender', { gender });
    }
    if (ageGroup) {
      qb.andWhere('pet.age_group = :ageGroup', { ageGroup });
    }
    if (adoptionStatus) {
      qb.andWhere('pet.adoption_status = :adoptionStatus', { adoptionStatus });
    }

    const total = await qb.clone().select('DISTINCT pet.id').getCount();

    const rawResults = await qb
      .select([
        'pet.id as id',
        `MAX(1 - (pi.embedding <=> '${vectorStr}'::vector)) as similarity`,
      ])
      .groupBy('pet.id')
      .orderBy(`MAX(1 - (pi.embedding <=> '${vectorStr}'::vector))`, 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<{ id: string; similarity: number }>();

    const petIds = rawResults.map((r) => r.id);

    if (petIds.length === 0) {
      const meta: ResponseMeta = {
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: limit,
        totalPages: 0,
        currentPage: page,
      };
      return { results: [], meta };
    }

    const pets = await this.petRepo.find({
      where: { id: In(petIds) } as FindOptionsWhere<Pet>,
      relations: ['species', 'breed', 'images'],
    });

    const petMap = new Map(pets.map((p) => [p.id, p]));
    const similarityMap = new Map(rawResults.map((r) => [r.id, r.similarity]));

    const results: PetSearchResult[] = petIds
      .map((id) => {
        const pet = petMap.get(id);
        if (!pet) return null;
        return {
          pet,
          similarityScore: similarityMap.get(id) ?? 0,
        };
      })
      .filter((r): r is PetSearchResult => r !== null);

    const meta: ResponseMeta = {
      totalItems: total,
      itemCount: results.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };

    return { results, meta };
  }
}
