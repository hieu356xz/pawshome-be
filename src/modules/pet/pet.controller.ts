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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PetService } from './pet.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { PetQueryDto } from './dto/pet-query.dto';
import { PetSearchDto } from './dto/pet-search.dto';
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
  @Post('search')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
      },
      fileFilter: (_req, file, callback) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
      },
    }),
  )
  search(
    @UploadedFile() file: Express.Multer.File,
    @Body() query: PetSearchDto,
  ) {
    const imageBase64 = file?.buffer?.toString('base64');
    const imageMimeType = file?.mimetype;

    return this.service.search(imageBase64, imageMimeType, query);
  }

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
