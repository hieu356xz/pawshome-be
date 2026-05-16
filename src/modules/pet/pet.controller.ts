import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PetService } from './pet.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetQueryDto } from './dto/pet-query.dto';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { Public } from '@/common/decorators/public.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { Pet } from './entities/pet.entity';

@Controller('pets')
export class PetController {
  constructor(private readonly service: PetService) {}

  @Public()
  @Get()
  findAll(@Query() query: PetQueryDto) {
    return this.service.findAll(query);
  }

  @Public()
  @Get(':id')
  @UseGuards(
    EntityExistGuard(Pet, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
  )
  findOne(@Param() { id }: IdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(PolicyGuard)
  @RequirePermissions('pet:create')
  create(@Body() data: CreatePetDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @UseGuards(
    EntityExistGuard(Pet, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet:update')
  update(@Param() { id }: IdParamDto, @Body() data: UpdatePetDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(Pet, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet:delete')
  remove(@Param() { id }: IdParamDto) {
    return this.service.remove(id);
  }
}
