import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { PetService } from '@modules/pet/pet.service';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';
import { MedicalRecordQueryDto } from './dto/medical-record-query.dto';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';

@Injectable()
export class MedicalRecordService {
  private readonly logger = new Logger(MedicalRecordService.name);

  constructor(
    @InjectRepository(MedicalRecord)
    private recordRepo: Repository<MedicalRecord>,
    @Inject(forwardRef(() => PetService))
    private petService: PetService,
  ) {}

  private async isPetExist(id: string): Promise<boolean> {
    return this.petService.isPetExist(id);
  }

  private async isRecordExist(id: string): Promise<boolean> {
    return this.recordRepo.exists({ where: { id } });
  }

  async findAll(
    query: MedicalRecordQueryDto,
  ): Promise<PaginatedResponse<MedicalRecord>> {
    const { page, limit, recordType, petId } = query;

    if (petId && !(await this.isPetExist(petId))) {
      throw new NotFoundException(`Pet #${petId} does not exist`);
    }

    const where: FindOptionsWhere<MedicalRecord> = {};
    if (petId) {
      where.petId = petId;
    }
    if (recordType) {
      where.recordType = recordType;
    }

    const order: FindOptionsOrder<MedicalRecord> = {
      recordDate: 'DESC',
      createdAt: 'DESC',
    };

    const [results, total] = await this.recordRepo.findAndCount({
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

  async findByPetId(petId: string): Promise<MedicalRecord[]> {
    return this.recordRepo.find({
      where: { petId },
      order: { recordDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MedicalRecord> {
    const record = await this.recordRepo.findOne({ where: { id } });
    if (!record)
      throw new NotFoundException(`MedicalRecord #${id} does not exist`);
    return record;
  }

  async create(
    petId: string,
    data: CreateMedicalRecordDto,
  ): Promise<MedicalRecord> {
    if (!(await this.isPetExist(petId))) {
      throw new NotFoundException(`Pet #${petId} does not exist`);
    }

    const record = this.recordRepo.create({
      ...data,
      recordDate: new Date(data.recordDate),
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
      petId,
    });
    return this.recordRepo.save(record);
  }

  async update(
    id: string,
    data: UpdateMedicalRecordDto,
  ): Promise<MedicalRecord> {
    if (!(await this.isRecordExist(id))) {
      throw new NotFoundException(`MedicalRecord #${id} does not exist`);
    }

    const { recordDate, nextDueDate, ...rest } = data;
    const updateData: Partial<MedicalRecord> = { ...rest };
    if (recordDate) {
      updateData.recordDate = new Date(recordDate);
    }
    if (nextDueDate) {
      updateData.nextDueDate = new Date(nextDueDate);
    }

    await this.recordRepo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    if (!(await this.isRecordExist(id))) {
      throw new NotFoundException(`MedicalRecord #${id} does not exist`);
    }

    const result = await this.recordRepo.delete(id);
    return !!result.affected;
  }

  async findUpcoming(petId: string): Promise<MedicalRecord[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.recordRepo
      .createQueryBuilder('mr')
      .where('mr.pet_id = :petId', { petId })
      .andWhere('mr.next_due_date IS NOT NULL')
      .andWhere('mr.next_due_date >= :today', { today })
      .orderBy('mr.next_due_date', 'ASC')
      .getMany();
  }
}
