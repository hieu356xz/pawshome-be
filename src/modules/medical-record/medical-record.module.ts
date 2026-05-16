import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecordService } from './medical-record.service';
import {
  MedicalRecordController,
  MedicalRecordAdminController,
} from './medical-record.controller';
import { MedicalRecord } from './entities/medical-record.entity';
import { PetService } from '../pet/pet.service';
import { PetModule } from '../pet/pet.module';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

const MEDICALRECORD_SERVICE = `MEDICALRECORD_${SERVICE_SUFFIX}`;

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalRecord]),
    forwardRef(() => PetModule),
  ],
  controllers: [MedicalRecordController, MedicalRecordAdminController],
  providers: [
    MedicalRecordService,
    PetService,
    {
      provide: MEDICALRECORD_SERVICE,
      useExisting: MedicalRecordService,
    },
  ],
  exports: [MedicalRecordService, MEDICALRECORD_SERVICE],
})
export class MedicalRecordModule {}
