import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdoptionRequestService } from './adoption-request.service';
import {
  AdoptionRequestController,
  AdoptionRequestAdminController,
} from './adoption-request.controller';
import { AdoptionRequest } from './entities/adoption-request.entity';
import { PetService } from '../pet/pet.service';
import { PetModule } from '../pet/pet.module';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

const ADOPTIONREQUEST_SERVICE = `ADOPTIONREQUEST_${SERVICE_SUFFIX}`;

@Module({
  imports: [
    TypeOrmModule.forFeature([AdoptionRequest]),
    forwardRef(() => PetModule),
  ],
  controllers: [AdoptionRequestController, AdoptionRequestAdminController],
  providers: [
    AdoptionRequestService,
    PetService,
    {
      provide: ADOPTIONREQUEST_SERVICE,
      useExisting: AdoptionRequestService,
    },
  ],
  exports: [AdoptionRequestService, ADOPTIONREQUEST_SERVICE],
})
export class AdoptionRequestModule {}
