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

@Controller('pets/:petId/images')
export class PetImageController {
  constructor(private readonly service: PetImageService) {}

  @Get()
  findAll(@Param('petId') petId: string) {
    return this.service.findByPetId(petId);
  }

  @Get(':id')
  findOne(@Param() { id }: { id: string }) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Param('petId') petId: string, @Body() data: CreatePetImageDto) {
    return this.service.create(petId, data.imageBase64, data.mimeType);
  }

  @Post('url')
  createFromUrl(
    @Param('petId') petId: string,
    @Body() data: CreatePetImageFromUrlDto,
  ) {
    return this.service.createFromUrl(petId, data.imageUrl);
  }

  @Post(':id/primary')
  setPrimary(@Param('petId') petId: string, @Param() { id }: { id: string }) {
    return this.service.setPrimary(id, petId);
  }

  @Delete(':id')
  remove(@Param() { id }: { id: string }) {
    return this.service.remove(id);
  }
}

@Controller('images')
export class ImageSearchController {
  constructor(private readonly service: PetImageService) {}

  @Get('search/text')
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
  searchSimilarImages(@UploadedFile() file: Express.Multer.File) {
    const base64 = file.buffer.toString('base64');
    return this.service.searchSimilarImages(base64, file.mimetype);
  }
}
