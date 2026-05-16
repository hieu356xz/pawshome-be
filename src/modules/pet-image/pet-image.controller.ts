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
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PetImageService } from './pet-image.service';
import {
  SearchImagesByTextDto,
  SearchImagesByImageAndTextDto,
} from './dto/search-pet-image.dto';
import { CreatePetImageFromUrlDto } from './dto/create-pet-image.dto';
import { PetImageIdParamDto } from './dto/pet-image-id-param.dto';
import { Public } from '@/common/decorators/public.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { Pet } from '@modules/pet/entities/pet.entity';
import { PetImage } from './entities/pet-image.entity';
import { PetImageQueryDto } from './dto/pet-image-query.dto';
import { PetIdParamDto } from './dto/pet-id-param.dto';
import { FILE_INTERCEPTOR_OPTIONS } from '@/common/constants/file.constants';

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
    EntityExistGuard(PetImage, {
      source: 'params',
      sourceField: 'id',
      dto: PetImageIdParamDto,
    }),
  )
  findOne(@Param() { id }: PetImageIdParamDto) {
    return this.service.findOne(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image', FILE_INTERCEPTOR_OPTIONS))
  @UseGuards(
    EntityExistGuard(Pet, {
      source: 'params',
      sourceField: 'petId',
      dto: PetIdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-image:create')
  async create(
    @Param('petId') petId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const image = await this.service.create(petId, file);
    return this.service.toResponseWithEmbedding(image);
  }

  @Post('url')
  @UseGuards(
    EntityExistGuard(Pet, {
      source: 'params',
      sourceField: 'petId',
      dto: PetIdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-image:create')
  async createFromUrl(
    @Param('petId') petId: string,
    @Body() data: CreatePetImageFromUrlDto,
  ) {
    const image = await this.service.createFromUrl(petId, data.imageUrl);
    return this.service.toResponseWithEmbedding(image);
  }

  @Post(':id/primary')
  @UseGuards(
    EntityExistGuard(PetImage, {
      source: 'params',
      sourceField: 'id',
      dto: PetImageIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-image:update')
  async setPrimary(@Param() { id }: PetImageIdParamDto) {
    const image = await this.service.setPrimary(id);
    return this.service.toResponseWithEmbedding(image);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(PetImage, {
      source: 'params',
      sourceField: 'id',
      dto: PetImageIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-image:delete')
  remove(@Param() { id }: PetImageIdParamDto) {
    return this.service.remove(id);
  }
}

@Controller('images')
export class ImageSearchController {
  constructor(private readonly service: PetImageService) {}

  @Get('search/text')
  @RequirePermissions('pet-image:list')
  searchByText(@Query() query: SearchImagesByTextDto) {
    const images = this.service.searchByText(query.text, query.limit);
    return images.then((imgs) => this.service.toResponsesWithEmbedding(imgs));
  }

  @Post('search')
  @UseInterceptors(FileInterceptor('image', FILE_INTERCEPTOR_OPTIONS))
  @RequirePermissions('pet-image:list')
  async searchByImageAndText(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SearchImagesByImageAndTextDto,
  ) {
    const imageBase64 = file?.buffer?.toString('base64');
    const imageMimeType = file?.mimetype;
    const queryText = body?.text;

    const images = await this.service.searchByImageAndText(
      imageBase64,
      imageMimeType,
      queryText,
    );
    return this.service.toResponsesWithEmbedding(images);
  }

  @Post('search/similar')
  @UseInterceptors(FileInterceptor('image', FILE_INTERCEPTOR_OPTIONS))
  @RequirePermissions('pet-image:list')
  async searchSimilarImages(@UploadedFile() file: Express.Multer.File) {
    const base64 = file.buffer.toString('base64');
    const images = await this.service.searchSimilarImages(
      base64,
      file.mimetype,
    );
    return this.service.toResponsesWithEmbedding(images);
  }
}
