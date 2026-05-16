import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { PetImageService } from './pet-image.service';
import {
  CreatePetImageDto,
  CreatePetImageFromUrlDto,
} from './dto/create-pet-image.dto';

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
