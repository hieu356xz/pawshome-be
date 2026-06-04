import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donation } from './entities/donation.entity';
import { DonationTransaction } from './entities/donation-transaction.entity';
import { DonationService } from './donation.service';
import { DonationController } from './donation.controller';
import { UserModule } from '@modules/user/user.module';
import { SERVICE_SUFFIX } from '@/common/interfaces/base-service.interface';

const DONATION_SERVICE = `DONATION_${SERVICE_SUFFIX}`;

@Module({
  imports: [
    TypeOrmModule.forFeature([Donation, DonationTransaction]),
    UserModule,
  ],
  controllers: [DonationController],
  providers: [
    DonationService,
    {
      provide: DONATION_SERVICE,
      useExisting: DonationService,
    },
  ],
  exports: [DonationService],
})
export class DonationModule {}
