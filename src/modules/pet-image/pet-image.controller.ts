import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PetImageService } from './pet-image.service';
import {
  CreatePetImageDto,
  CreatePetImageFromUrlDto,
} from './dto/create-pet-image.dto';
import {
  SearchImagesByTextDto,
  SearchImagesByImageAndTextDto,
} from './dto/search-pet-image.dto';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { Public } from '@/common/decorators/public.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { Pet } from '@modules/pet/entities/pet.entity';
import { PetImage } from './entities/pet-image.entity';
import { PetImageQueryDto } from './dto/pet-image-query.dto';
import { PetIdParamDto } from './dto/pet-id-param.dto';

@Controller('pets/:petId/images')
export class PetImageController {
  constructor(private readonly service: PetImageService) {}

  @Public()
  @Get()
  @UseGuards(
    EntityExistGuard(Pet, {
      source: 'params',
      sourceField: 'petId',
      dto: PetIdParamDto,
      dbField: 'id',
    }),
  )
  findAll(@Param('petId') petId: string, @Query() query: PetImageQueryDto) {
    return this.service.findAll({ ...query, petId });
  }

  @Public()
  @Get(':id')
  @UseGuards(
    EntityExistGuard(Pet, {
      source: 'params',
      sourceField: 'petId',
      dto: PetIdParamDto,
      dbField: 'id',
    }),
  )
  findOne(@Param() { id }: IdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(
    EntityExistGuard(PetImage, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-image:create')
  create(@Param('petId') petId: string, @Body() data: CreatePetImageDto) {
    return this.service.create(petId, data.imageBase64, data.mimeType);
  }

  @Post('url')
  @UseGuards(
    EntityExistGuard(PetImage, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-image:create')
  createFromUrl(
    @Param('petId') petId: string,
    @Body() data: CreatePetImageFromUrlDto,
  ) {
    return this.service.createFromUrl(petId, data.imageUrl);
  }

  @Post(':id/primary')
  @UseGuards(
    EntityExistGuard(PetImage, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-image:update')
  setPrimary(@Param() { id }: IdParamDto) {
    return this.service.setPrimary(id);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(PetImage, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-image:delete')
  remove(@Param() { id }: IdParamDto) {
    return this.service.remove(id);
  }
}

@Controller('images')
export class ImageSearchController {
  constructor(private readonly service: PetImageService) {}

  @Get('search/text')
  @RequirePermissions('pet-image:list')
  searchByText(@Query() query: SearchImagesByTextDto) {
    return this.service.searchByText(query.text, query.limit);
  }

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
  @RequirePermissions('pet-image:list')
  searchByImageAndText(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SearchImagesByImageAndTextDto,
  ) {
    const imageBase64 = file?.buffer?.toString('base64');
    const imageMimeType = file?.mimetype;
    const queryText = body?.text;

    return this.service.searchByImageAndText(
      imageBase64,
      imageMimeType,
      queryText,
    );
  }

  @Post('search/similar')
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
  @RequirePermissions('pet-image:list')
  searchSimilarImages(@UploadedFile() file: Express.Multer.File) {
    const base64 = file.buffer.toString('base64');
    return this.service.searchSimilarImages(base64, file.mimetype);
  }
}
