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
import { MailService } from '@modules/mail/mail.service';
import { AdoptionStatus } from '@modules/pet/enums/adoption-status.enum';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';
import { AdoptionRequestQueryDto } from './dto/adoption-request-query.dto';
import { CreateAdoptionRequestDto } from './dto/create-adoption-request.dto';
import { ReviewAdoptionRequestDto } from './dto/review-adoption-request.dto';
import { AdoptionRequestStatus } from './enums/adoption-request-status.enum';
import { RejectionReason } from './enums/rejection-reason.enum';

@Injectable()
export class AdoptionRequestService {
  private readonly logger = new Logger(AdoptionRequestService.name);

  constructor(
    @InjectRepository(AdoptionRequest)
    private requestRepo: Repository<AdoptionRequest>,
    @Inject(forwardRef(() => PetService))
    private petService: PetService,
    private readonly mailService: MailService,
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
      updateData.rejectionNote = data.rejectionNote || null;
    }

    if (data.status === AdoptionRequestStatus.APPROVED) {
      updateData.approvalMessage = data.approvalMessage || null;
    }

    await this.requestRepo.update(id, updateData);

    const language = ['vi', 'en'].includes(data.language || '')
      ? data.language
      : 'vi';

    if (data.status === AdoptionRequestStatus.APPROVED) {
      await this.petService.update(request.petId, {
        adoptionStatus: AdoptionStatus.ADOPTED,
      });

      await this.requestRepo.update(
        { petId: request.petId, id: Not(id) },
        {
          status: AdoptionRequestStatus.REJECTED,
          rejectionReason: RejectionReason.OTHER_REQUEST_APPROVED,
        },
      );

      await this.sendAdoptionApprovedEmail(
        request.email,
        request.pet.name,
        request.applicantName,
        data.approvalMessage || null,
        language,
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

      if (data.rejectionReason) {
        await this.sendAdoptionRejectedEmail(
          request.email,
          request.pet.name,
          request.applicantName,
          data.rejectionReason,
          data.rejectionNote || null,
          language,
        );
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

  private getRejectionReasonText(
    reason: RejectionReason,
    language: string = 'en',
  ): string {
    const reasonTexts: Record<string, Record<RejectionReason, string>> = {
      en: {
        [RejectionReason.NOT_ENOUGH_EXPERIENCE]:
          'Not enough pet care experience',
        [RejectionReason.INSUFFICIENT_LIVING_SPACE]:
          'Insufficient living space',
        [RejectionReason.NO_YARD_FOR_PET]: 'No suitable outdoor space',
        [RejectionReason.FINANCIAL_UNSTABLE]: 'Financial instability',
        [RejectionReason.COMMITMENT_QUESTIONS]: 'Unclear commitment',
        [RejectionReason.OTHER_PETS_INCOMPATIBLE]:
          'Incompatible with existing pets',
        [RejectionReason.PET_ALREADY_ADOPTED]: 'Pet already adopted',
        [RejectionReason.INCOMPLETE_APPLICATION]:
          'Incomplete application information',
        [RejectionReason.OTHER_REQUEST_APPROVED]:
          'Another request was approved',
      },
      vi: {
        [RejectionReason.NOT_ENOUGH_EXPERIENCE]:
          'Không đủ kinh nghiệm chăm sóc thú cưng',
        [RejectionReason.INSUFFICIENT_LIVING_SPACE]:
          'Không gian sống không phù hợp',
        [RejectionReason.NO_YARD_FOR_PET]:
          'Không có không gian ngoài trời phù hợp',
        [RejectionReason.FINANCIAL_UNSTABLE]: 'Tài chính không ổn định',
        [RejectionReason.COMMITMENT_QUESTIONS]: 'Cam kết chưa rõ ràng',
        [RejectionReason.OTHER_PETS_INCOMPATIBLE]:
          'Không tương thích với thú cưng hiện có',
        [RejectionReason.PET_ALREADY_ADOPTED]: 'Thú cưng đã được nhận nuôi',
        [RejectionReason.INCOMPLETE_APPLICATION]: 'Thông tin đơn không đầy đủ',
        [RejectionReason.OTHER_REQUEST_APPROVED]: 'Đơn khác đã được duyệt',
      },
    };

    return reasonTexts[language]?.[reason] || reasonTexts.en[reason] || reason;
  }

  private async sendAdoptionApprovedEmail(
    email: string,
    petName: string,
    applicantName: string,
    approvalMessage: string | null,
    language: 'en' | 'vi' = 'vi',
  ): Promise<void> {
    const templates: Record<string, { subject: string; template: string }> = {
      en: {
        subject: 'Your Adoption Request Has Been Approved - Pawshome',
        template: 'adoption-approved',
      },
      vi: {
        subject: 'Yêu cầu nhận nuôi đã được duyệt - Pawshome',
        template: 'adoption-approved-vi',
      },
    };

    const { subject, template } = templates[language] || templates.vi;

    await this.mailService.sendTemplateMail({
      to: email,
      subject,
      template,
      variables: {
        petName,
        applicantName,
        approvalMessage: approvalMessage || null,
      },
    });
  }

  private async sendAdoptionRejectedEmail(
    email: string,
    petName: string,
    applicantName: string,
    rejectionReason: RejectionReason,
    rejectionNote: string | null = null,
    language: 'en' | 'vi' = 'vi',
  ): Promise<void> {
    const templates: Record<string, { subject: string; template: string }> = {
      en: {
        subject: 'Your Adoption Request Has Been Reviewed - Pawshome',
        template: 'adoption-rejected',
      },
      vi: {
        subject: 'Yêu cầu nhận nuôi đã được xem xét - Pawshome',
        template: 'adoption-rejected-vi',
      },
    };

    const reasonText = this.getRejectionReasonText(rejectionReason, language);

    const { subject, template } = templates[language] || templates.vi;

    await this.mailService.sendTemplateMail({
      to: email,
      subject,
      template,
      variables: {
        petName,
        applicantName,
        rejectionReason: reasonText,
        rejectionNote,
      },
    });
  }
}
