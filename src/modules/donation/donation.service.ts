import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type FindOptionsWhere, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PayOS, Webhook } from '@payos/node';
import { Donation } from './entities/donation.entity';
import { DonationTransaction } from './entities/donation-transaction.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { DonationQueryDto } from './dto/donation-query.dto';
import { DonationStatus } from './enums/donation-status.enum';
import { UserService } from '@modules/user/user.service';
import {
  PaginatedResponse,
  ResponseMeta,
} from '@common/interfaces/response.interface';

export interface SanitizedDonation {
  id: string;
  amount: number;
  donorName: string;
  message: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

@Injectable()
export class DonationService {
  private readonly logger = new Logger(DonationService.name);
  private readonly payos: PayOS;

  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
    @InjectRepository(DonationTransaction)
    private readonly transactionRepo: Repository<DonationTransaction>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.payos = new PayOS({
      clientId: this.configService.getOrThrow<string>('PAYOS_CLIENT_ID'),
      apiKey: this.configService.getOrThrow<string>('PAYOS_API_KEY'),
      checksumKey: this.configService.getOrThrow<string>('PAYOS_CHECKSUM_KEY'),
    });
  }

  async createDonation(dto: CreateDonationDto, userId?: string) {
    let donorName = dto.donorName;
    let donorEmail = dto.donorEmail;
    let donorPhone = dto.donorPhone;

    if (userId) {
      try {
        const user = await this.userService.findOne(userId);
        if (user) {
          if (!donorName) donorName = user.fullName;
          if (!donorEmail) donorEmail = user.email;
          if (!donorPhone) donorPhone = user.phoneNumber;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to pre-fill user info for donation: ${(error as any).message}`,
        );
      }
    }

    if (!donorName) {
      donorName = dto.isAnonymous ? 'Người ẩn danh' : 'Mạnh thường quân';
    }

    const donation = this.donationRepo.create({
      amount: dto.amount,
      donorName,
      donorEmail: donorEmail || null,
      donorPhone: donorPhone || null,
      message: dto.message || null,
      isAnonymous: dto.isAnonymous ?? false,
      status: DonationStatus.PENDING,
      userId: userId || null,
    });

    // Save donation to generate auto-incrementing orderCode
    const savedDonation = await this.donationRepo.save(donation);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const returnUrl = dto.returnUrl || `${frontendUrl}/donate/success`;
    const cancelUrl = dto.cancelUrl || `${frontendUrl}/donate/cancel`;

    try {
      // PayOS creates payment link. Description must be alphanumeric, no accents, max 25 chars.
      const paymentData = {
        orderCode: Number(savedDonation.orderCode),
        amount: Number(savedDonation.amount),
        description: `Pawshome`,
        cancelUrl,
        returnUrl,
      };

      const payosResponse =
        await this.payos.paymentRequests.create(paymentData);

      savedDonation.checkoutUrl = payosResponse.checkoutUrl;
      savedDonation.paymentLinkId = payosResponse.paymentLinkId;
      await this.donationRepo.save(savedDonation);

      return {
        id: savedDonation.id,
        orderCode: savedDonation.orderCode,
        amount: savedDonation.amount,
        checkoutUrl: payosResponse.checkoutUrl,
        status: savedDonation.status,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create PayOS payment link: ${(error as any).message}`,
      );
      // Remove the donation record if payment generation failed to prevent junk pending records
      await this.donationRepo.remove(savedDonation);
      throw new BadRequestException(`PayOS Error: ${(error as any).message}`);
    }
  }

  async handleWebhook(body: Webhook) {
    try {
      this.logger.log('Receiving PayOS Webhook notification...');
      const webhookData = await this.payos.webhooks.verify(body);
      this.logger.log(
        `Webhook verified successfully for orderCode: ${webhookData.orderCode}`,
      );

      // Check if it's the test webhook (orderCode is often 0 or has test description)
      if (
        webhookData.orderCode === 0 ||
        webhookData.description === 'Ma giao dich thu nghiem'
      ) {
        this.logger.log('Test webhook payload verified successfully.');
        return { success: true, message: 'Test webhook verified' };
      }

      const orderCode = webhookData.orderCode;
      const donation = await this.donationRepo.findOne({
        where: { orderCode },
      });

      if (!donation) {
        this.logger.warn(
          `No donation intent found for orderCode: ${orderCode}`,
        );
        return { success: true, message: 'Donation not found' };
      }

      if (donation.status === DonationStatus.PAID) {
        this.logger.warn(
          `Donation with orderCode ${orderCode} is already paid.`,
        );
        return { success: true, message: 'Already processed' };
      }

      // 1. Create DonationTransaction record
      const transaction = this.transactionRepo.create({
        donationId: donation.id,
        referenceNumber: webhookData.reference,
        bankTransactionTime: new Date(webhookData.transactionDateTime),
        amount: webhookData.amount,
        senderAccountName: webhookData.counterAccountName || null,
        senderAccountNumber: webhookData.counterAccountNumber || null,
        rawWebhookData: JSON.stringify(body),
      });

      await this.transactionRepo.save(transaction);

      // 2. Update Donation status to PAID
      donation.status = DonationStatus.PAID;
      donation.paidAt = new Date();
      await this.donationRepo.save(donation);

      this.logger.log(`Donation ${donation.id} marked as PAID.`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Webhook verification/processing failed: ${(error as any).message}`,
      );
      throw new BadRequestException(`Webhook Error: ${(error as any).message}`);
    }
  }

  async getDonationByOrderCode(orderCode: number) {
    const donation = await this.donationRepo.findOne({
      where: { orderCode },
      relations: ['transactions'],
    });

    if (!donation) {
      throw new NotFoundException(
        `Donation order #${orderCode} does not exist`,
      );
    }

    return donation;
  }

  async getDonations(
    query: DonationQueryDto,
  ): Promise<PaginatedResponse<SanitizedDonation>> {
    const { page, limit, status, sortBy, sortOrder } = query;

    const where: FindOptionsWhere<Donation> = {};
    if (status) {
      where.status = status;
    } else {
      // By default for public view, only show successful donations
      where.status = DonationStatus.PAID;
    }

    // Define allowed sort columns for validation
    const allowedSortFields = ['createdAt', 'amount', 'donorName', 'paidAt'];
    const finalSortBy = allowedSortFields.includes(sortBy || '')
      ? sortBy
      : 'createdAt';
    const finalSortOrder = sortOrder ?? 'DESC';

    const [results, total] = await this.donationRepo.findAndCount({
      where,
      order: { [finalSortBy as string]: finalSortOrder },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Sanitize anonymous donors
    const sanitizedResults = results.map((d) => ({
      id: d.id,
      amount: d.amount,
      donorName: d.isAnonymous
        ? 'Người ẩn danh'
        : d.donorName || 'Mạnh thường quân',
      message: d.message,
      paidAt: d.paidAt,
      createdAt: d.createdAt,
    }));

    const meta: ResponseMeta = {
      totalItems: total,
      itemCount: sanitizedResults.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };

    return { results: sanitizedResults, meta };
  }

  async getDonationStats() {
    // Total amount raised from PAID donations
    const totalResult = await this.donationRepo
      .createQueryBuilder('donation')
      .select('SUM(donation.amount)', 'total')
      .where('donation.status = :status', { status: DonationStatus.PAID })
      .getRawOne();

    const totalAmount = parseFloat(totalResult?.total || '0');

    // Total number of successful donations
    const donationCount = await this.donationRepo.count({
      where: { status: DonationStatus.PAID },
    });

    // Top donors leaderboard (excluding anonymous names or displaying them as "Người ẩn danh")
    const topDonorsRaw = await this.donationRepo
      .createQueryBuilder('donation')
      .select('donation.donorName', 'donorName')
      .addSelect('donation.isAnonymous', 'isAnonymous')
      .addSelect('SUM(donation.amount)', 'totalAmount')
      .where('donation.status = :status', { status: DonationStatus.PAID })
      .groupBy('donation.donorName')
      .addGroupBy('donation.isAnonymous')
      .orderBy('SUM(donation.amount)', 'DESC')
      .limit(10)
      .getRawMany();

    const topDonors = topDonorsRaw.map((item) => ({
      donorName: item.isAnonymous
        ? 'Người ẩn danh'
        : item.donorName || 'Mạnh thường quân',
      totalAmount: parseFloat(item.totalAmount),
    }));

    // Recent donations list (last 5)
    const recentDonations = await this.donationRepo.find({
      where: { status: DonationStatus.PAID },
      order: { paidAt: 'DESC' },
      take: 5,
    });

    const sanitizedRecent = recentDonations.map((d) => ({
      id: d.id,
      amount: d.amount,
      donorName: d.isAnonymous
        ? 'Người ẩn danh'
        : d.donorName || 'Mạnh thường quân',
      message: d.message,
      paidAt: d.paidAt,
    }));

    return {
      totalAmount,
      donationCount,
      topDonors,
      recentDonations: sanitizedRecent,
    };
  }

  async cancelDonation(orderCode: number, reason?: string) {
    const donation = await this.getDonationByOrderCode(orderCode);

    if (donation.status === DonationStatus.PAID) {
      throw new BadRequestException(
        'Cannot cancel an already completed donation',
      );
    }

    try {
      // Call PayOS to cancel payment link if it's pending
      if (donation.status === DonationStatus.PENDING) {
        await this.payos.paymentRequests.cancel(
          Number(orderCode),
          reason || 'Khách hàng hủy quyên góp',
        );
      }
    } catch (error) {
      this.logger.warn(
        `Could not cancel payment link on PayOS (it might have already expired/been cancelled): ${(error as any).message}`,
      );
    }

    donation.status = DonationStatus.CANCELLED;
    await this.donationRepo.save(donation);

    return { success: true, status: donation.status };
  }
}
