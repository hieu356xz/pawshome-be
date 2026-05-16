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
import { AdoptionRequestService } from './adoption-request.service';
import { CreateAdoptionRequestDto } from './dto/create-adoption-request.dto';
import { ReviewAdoptionRequestDto } from './dto/review-adoption-request.dto';
import { AdoptionRequestIdParamDto } from './dto/adoption-request-id-param.dto';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { AdoptionRequest } from './entities/adoption-request.entity';
import { AdoptionRequestQueryDto } from './dto/adoption-request-query.dto';
import { Pet } from '@modules/pet/entities/pet.entity';
import { PetIdParamDto } from '../pet-image/dto/pet-id-param.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@modules/auth/interfaces/user-payload.interface';

@Controller('pets/:petId/adoption-requests')
export class AdoptionRequestController {
  constructor(private readonly service: AdoptionRequestService) {}

  @Get()
  @UseGuards(
    EntityExistGuard(Pet, {
      source: 'params',
      sourceField: 'petId',
      dto: PetIdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('adoption-request:read')
  findAll(
    @Param('petId') petId: string,
    @Query() query: AdoptionRequestQueryDto,
  ) {
    return this.service.findAll({ ...query, petId });
  }

  @Get(':id')
  @UseGuards(
    EntityExistGuard(AdoptionRequest, {
      source: 'params',
      sourceField: 'id',
      dto: AdoptionRequestIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('adoption-request:read')
  findOne(@Param() { id }: AdoptionRequestIdParamDto) {
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
  @RequirePermissions('adoption-request:create')
  create(
    @Param('petId') petId: string,
    @CurrentUser() user: UserPayload,
    @Body() data: CreateAdoptionRequestDto,
  ) {
    return this.service.create(petId, user.userId, data);
  }

  @Put(':id/review')
  @UseGuards(
    EntityExistGuard(AdoptionRequest, {
      source: 'params',
      sourceField: 'id',
      dto: AdoptionRequestIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('adoption-request:update')
  review(
    @Param() { id }: AdoptionRequestIdParamDto,
    @CurrentUser() user: UserPayload,
    @Body() data: ReviewAdoptionRequestDto,
  ) {
    return this.service.review(id, user.userId, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(AdoptionRequest, {
      source: 'params',
      sourceField: 'id',
      dto: AdoptionRequestIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('adoption-request:delete')
  remove(@Param() { id }: AdoptionRequestIdParamDto) {
    return this.service.remove(id);
  }
}

@Controller('adoption-requests')
export class AdoptionRequestAdminController {
  constructor(private readonly service: AdoptionRequestService) {}

  @Get()
  @RequirePermissions('adoption-request:list')
  findAll(@Query() query: AdoptionRequestQueryDto) {
    return this.service.findAll(query);
  }

  @Get('my-requests')
  @RequirePermissions('adoption-request:read')
  findMyRequests(@CurrentUser() user: UserPayload) {
    return this.service.findByUserId(user.userId);
  }
}
