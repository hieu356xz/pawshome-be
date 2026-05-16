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
import { BreedService } from './breed.service';
import { CreateBreedDto } from './dto/create-breed.dto';
import { UpdateBreedDto } from './dto/update-breed.dto';
import { BreedQueryDto } from './dto/breed-query.dto';
import { NumberIdParamDto } from '@/common/dto/number-id-param.dto';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { Breed } from './entities/breed.entity';

@Controller('breeds')
export class BreedController {
  constructor(private readonly service: BreedService) {}

  @Get()
  @RequirePermissions('breed:list')
  findAll(@Query() query: BreedQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(
    EntityExistGuard(Breed, {
      source: 'params',
      sourceField: 'id',
      dto: NumberIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('breed:read')
  findOne(@Param() { id }: NumberIdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(PolicyGuard)
  @RequirePermissions('breed:create')
  create(@Body() data: CreateBreedDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @UseGuards(
    EntityExistGuard(Breed, {
      source: 'params',
      sourceField: 'id',
      dto: NumberIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('breed:update')
  update(@Param() { id }: NumberIdParamDto, @Body() data: UpdateBreedDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(Breed, {
      source: 'params',
      sourceField: 'id',
      dto: NumberIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('breed:delete')
  remove(@Param() { id }: NumberIdParamDto) {
    return this.service.remove(id);
  }
}
