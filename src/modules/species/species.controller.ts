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
import { SpeciesService } from './species.service';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';
import { SpeciesQueryDto } from './dto/species-query.dto';
import { NumberIdParamDto } from '@/common/dto/number-id-param.dto';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { Species } from './entities/species.entity';

@Controller('species')
@UseGuards(PolicyGuard)
export class SpeciesController {
  constructor(private readonly service: SpeciesService) {}

  @Get()
  @UseGuards(PolicyGuard)
  @RequirePermissions('species:list')
  findAll(@Query() query: SpeciesQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(
    EntityExistGuard(Species, {
      source: 'params',
      sourceField: 'id',
      dto: NumberIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('species:read')
  findOne(@Param() { id }: NumberIdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(PolicyGuard)
  @RequirePermissions('species:create')
  create(@Body() data: CreateSpeciesDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @UseGuards(
    EntityExistGuard(Species, {
      source: 'params',
      sourceField: 'id',
      dto: NumberIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('species:update')
  update(@Param() { id }: NumberIdParamDto, @Body() data: UpdateSpeciesDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(Species, {
      source: 'params',
      sourceField: 'id',
      dto: NumberIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('species:delete')
  remove(@Param() { id }: NumberIdParamDto) {
    return this.service.remove(id);
  }
}
