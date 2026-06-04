import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { DonationService } from './donation.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { DonationQueryDto } from './dto/donation-query.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@modules/auth/interfaces/user-payload.interface';
import type { Webhook } from '@payos/node';

@Controller('donations')
export class DonationController {
  constructor(private readonly service: DonationService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateDonationDto, @CurrentUser() user?: UserPayload) {
    return this.service.createDonation(dto, user?.userId);
  }

  @Public()
  @Post('webhook')
  handleWebhook(@Body() body: Webhook) {
    return this.service.handleWebhook(body);
  }

  @Public()
  @Get()
  findAll(@Query() query: DonationQueryDto) {
    return this.service.getDonations(query);
  }

  @Public()
  @Get('stats')
  getStats() {
    return this.service.getDonationStats();
  }

  @Public()
  @Get(':orderCode')
  findOne(@Param('orderCode', ParseIntPipe) orderCode: number) {
    return this.service.getDonationByOrderCode(orderCode);
  }

  @Public()
  @Post(':orderCode/cancel')
  cancel(
    @Param('orderCode', ParseIntPipe) orderCode: number,
    @Body('reason') reason?: string,
  ) {
    return this.service.cancelDonation(orderCode, reason);
  }
}
