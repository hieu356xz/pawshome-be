import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MedicalRecordService } from './medical-record.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { MedicalRecordIdParamDto } from './dto/medical-record-id-param.dto';
import { Public } from '@/common/decorators/public.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { Pet } from '@modules/pet/entities/pet.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { MedicalRecordQueryDto } from './dto/medical-record-query.dto';
import { PetIdParamDto } from '../pet-image/dto/pet-id-param.dto';

@Controller('pets/:petId/medical-records')
export class MedicalRecordController {
  constructor(private readonly service: MedicalRecordService) {}

  @Public()
  @Get()
  @UseGuards(
    EntityExistGuard(Pet, {
      source: 'params',
      sourceField: 'petId',
      dto: PetIdParamDto,
      dbField: 'id',
    }),
  )
  findAll(
    @Param('petId') petId: string,
    @Query() query: MedicalRecordQueryDto,
  ) {
    return this.service.findAll({ ...query, petId });
  }

  @Public()
  @Get(':id')
  @UseGuards(
    EntityExistGuard(MedicalRecord, {
      source: 'params',
      sourceField: 'id',
      dto: MedicalRecordIdParamDto,
    }),
  )
  findOne(@Param() { id }: MedicalRecordIdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(
    EntityExistGuard(Pet, {
      source: 'params',
      sourceField: 'petId',
      dto: PetIdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('medical-record:create')
  create(@Param('petId') petId: string, @Body() data: CreateMedicalRecordDto) {
    return this.service.create(petId, data);
  }

  @Put(':id')
  @UseGuards(
    EntityExistGuard(MedicalRecord, {
      source: 'params',
      sourceField: 'id',
      dto: MedicalRecordIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('medical-record:update')
  update(
    @Param() { id }: MedicalRecordIdParamDto,
    @Body() data: UpdateMedicalRecordDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(MedicalRecord, {
      source: 'params',
      sourceField: 'id',
      dto: MedicalRecordIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('medical-record:delete')
  remove(@Param() { id }: MedicalRecordIdParamDto) {
    return this.service.remove(id);
  }
}

@Controller('medical-records')
export class MedicalRecordAdminController {
  constructor(private readonly service: MedicalRecordService) {}

  @Get('upcoming')
  @RequirePermissions('medical-record:list')
  findUpcoming(@Query('petId') petId: string) {
    return this.service.findUpcoming(petId);
  }
}
