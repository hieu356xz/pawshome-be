import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder, Not } from 'typeorm';
import { AdoptionRequest } from './entities/adoption-request.entity';
import { PetService } from '@modules/pet/pet.service';
import { AdoptionStatus } from '@modules/pet/enums/adoption-status.enum';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';
import { AdoptionRequestQueryDto } from './dto/adoption-request-query.dto';
import { CreateAdoptionRequestDto } from './dto/create-adoption-request.dto';
import { ReviewAdoptionRequestDto } from './dto/review-adoption-request.dto';
import { AdoptionRequestStatus } from './enums/adoption-request-status.enum';

@Injectable()
export class AdoptionRequestService {
  private readonly logger = new Logger(AdoptionRequestService.name);

  constructor(
    @InjectRepository(AdoptionRequest)
    private requestRepo: Repository<AdoptionRequest>,
    @Inject(forwardRef(() => PetService))
    private petService: PetService,
  ) {}

  private async isPetExist(id: string): Promise<boolean> {
    return this.petService.isPetExist(id);
  }

  private async isRequestExist(id: string): Promise<boolean> {
    return this.requestRepo.exists({ where: { id } });
  }

  async findAll(
    query: AdoptionRequestQueryDto,
  ): Promise<PaginatedResponse<AdoptionRequest>> {
    const { page, limit, status, petId, userId } = query;

    if (petId && !(await this.isPetExist(petId))) {
      throw new NotFoundException(`Pet #${petId} does not exist`);
    }

    const where: FindOptionsWhere<AdoptionRequest> = {};
    if (petId) {
      where.petId = petId;
    }
    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }

    const order: FindOptionsOrder<AdoptionRequest> = {
      createdAt: 'DESC',
    };

    const [results, total] = await this.requestRepo.findAndCount({
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

  async findByPetId(petId: string): Promise<AdoptionRequest[]> {
    return this.requestRepo.find({
      where: { petId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<AdoptionRequest[]> {
    return this.requestRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AdoptionRequest> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['pet', 'user'],
    });
    if (!request)
      throw new NotFoundException(`AdoptionRequest #${id} does not exist`);
    return request;
  }

  async create(
    petId: string,
    userId: string,
    data: CreateAdoptionRequestDto,
  ): Promise<AdoptionRequest> {
    if (!(await this.isPetExist(petId))) {
      throw new NotFoundException(`Pet #${petId} does not exist`);
    }

    const existingRequest = await this.requestRepo.findOne({
      where: { petId, userId, status: AdoptionRequestStatus.PENDING },
    });
    if (existingRequest) {
      throw new Error('You already have a pending request for this pet');
    }

    const request = this.requestRepo.create({
      ...data,
      petId,
      userId,
    });
    const saved = await this.requestRepo.save(request);

    await this.petService.update(petId, {
      adoptionStatus: AdoptionStatus.PENDING,
    });

    return this.findOne(saved.id);
  }

  async review(
    id: string,
    reviewerId: string,
    data: ReviewAdoptionRequestDto,
  ): Promise<AdoptionRequest> {
    if (!(await this.isRequestExist(id))) {
      throw new NotFoundException(`AdoptionRequest #${id} does not exist`);
    }

    const request = await this.findOne(id);

    if (request.status !== AdoptionRequestStatus.PENDING) {
      throw new Error('This request has already been reviewed');
    }

    const updateData: Partial<AdoptionRequest> = {
      status: data.status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    };

    if (
      data.status === AdoptionRequestStatus.REJECTED &&
      data.rejectionReason
    ) {
      updateData.rejectionReason = data.rejectionReason;
    }

    await this.requestRepo.update(id, updateData);

    if (data.status === AdoptionRequestStatus.APPROVED) {
      await this.petService.update(request.petId, {
        adoptionStatus: AdoptionStatus.ADOPTED,
      });

      await this.requestRepo.update(
        { petId: request.petId, id: Not(id) },
        {
          status: AdoptionRequestStatus.REJECTED,
          rejectionReason: 'Another request was approved',
        },
      );
    } else if (data.status === AdoptionRequestStatus.REJECTED) {
      const pendingCount = await this.requestRepo.count({
        where: {
          petId: request.petId,
          status: AdoptionRequestStatus.PENDING,
        },
      });
      if (pendingCount === 0) {
        await this.petService.update(request.petId, {
          adoptionStatus: AdoptionStatus.SEEKING,
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    if (!(await this.isRequestExist(id))) {
      throw new NotFoundException(`AdoptionRequest #${id} does not exist`);
    }

    const request = await this.findOne(id);

    if (request.status === AdoptionRequestStatus.PENDING) {
      const pendingCount = await this.requestRepo.count({
        where: {
          petId: request.petId,
          status: AdoptionRequestStatus.PENDING,
          id: Not(id),
        },
      });
      if (pendingCount === 0) {
        await this.petService.update(request.petId, {
          adoptionStatus: AdoptionStatus.SEEKING,
        });
      }
    }

    const result = await this.requestRepo.delete(id);
    return !!result.affected;
  }
}
