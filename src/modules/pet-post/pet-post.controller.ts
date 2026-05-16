import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PetPostService } from './pet-post.service';
import { CreatePetPostDto, UpdatePetPostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PetPostQueryDto } from './dto/post-query.dto';
import { PetPostIdParamDto } from './dto/pet-post-id-param.dto';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { Public } from '@/common/decorators/public.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@modules/auth/interfaces/user-payload.interface';
import { PetPost } from './entities/pet-post.entity';
import { PetPostComment } from './entities/pet-post-comment.entity';
import { PostStatus } from './enums/post-status.enum';
import { FILE_INTERCEPTOR_OPTIONS } from '@/common/constants/file.constants';

@Controller('pet-posts')
export class PetPostController {
  constructor(private readonly service: PetPostService) {}

  @Public()
  @Get()
  findAll(@Query() query: PetPostQueryDto) {
    return this.service.findAll(query);
  }

  @Public()
  @Get(':id')
  @UseGuards(
    EntityExistGuard(PetPost, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
      dbField: 'id',
    }),
  )
  findOne(@Param() { id }: IdParamDto) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(PolicyGuard)
  @RequirePermissions('pet-post:create')
  create(@CurrentUser() user: UserPayload, @Body() data: CreatePetPostDto) {
    return this.service.create(user.userId, data);
  }

  @Put(':id')
  @UseGuards(
    EntityExistGuard(PetPost, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-post:update')
  update(@Param() { id }: IdParamDto, @Body() data: UpdatePetPostDto) {
    return this.service.update(id, data);
  }

  @Put(':id/status')
  @UseGuards(
    EntityExistGuard(PetPost, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-post:update')
  updateStatus(
    @Param() { id }: IdParamDto,
    @Body() body: { status: PostStatus },
  ) {
    return this.service.updateStatus(id, body.status);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(PetPost, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-post:delete')
  remove(@Param() { id }: IdParamDto, @CurrentUser() user: UserPayload) {
    return this.service.remove(id, user.userId);
  }
}

@Controller('pet-posts/:postId/images')
export class PetPostImageController {
  constructor(private readonly service: PetPostService) {}

  @Public()
  @Get()
  findAllImages(@Param('postId') postId: string) {
    return this.service.getImages(postId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', FILE_INTERCEPTOR_OPTIONS))
  @UseGuards(PolicyGuard)
  @RequirePermissions('pet-post:create')
  async uploadImage(
    @Param('postId') postId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.addImage(postId, file);
  }

  @Delete(':id')
  @UseGuards(PolicyGuard)
  @RequirePermissions('pet-post:delete')
  remove(@Param() { id }: PetPostIdParamDto) {
    return this.service.deleteImage(id);
  }
}

@Controller('pet-posts/:postId/comments')
export class PetPostCommentController {
  constructor(private readonly service: PetPostService) {}

  @Public()
  @Get()
  findAllComments(@Param('postId') postId: string) {
    return this.service.getComments(postId);
  }

  @Post()
  @UseGuards(PolicyGuard)
  @RequirePermissions('pet-post-comment:create')
  create(
    @Param('postId') postId: string,
    @CurrentUser() user: UserPayload,
    @Body() data: CreateCommentDto,
  ) {
    return this.service.addComment(postId, user.userId, data);
  }

  @Put(':id')
  @UseGuards(
    EntityExistGuard(PetPostComment, {
      source: 'params',
      sourceField: 'id',
      dto: PetPostIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-post-comment:update')
  update(@Param() { id }: PetPostIdParamDto, @Body() data: UpdateCommentDto) {
    return this.service.updateComment(id, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(PetPostComment, {
      source: 'params',
      sourceField: 'id',
      dto: PetPostIdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('pet-post-comment:delete')
  remove(@Param() { id }: PetPostIdParamDto, @CurrentUser() user: UserPayload) {
    return this.service.deleteComment(id, user.userId);
  }
}

@Controller('pet-posts/search')
export class PetPostSearchController {
  constructor(private readonly service: PetPostService) {}

  @Public()
  @Post('image')
  @UseInterceptors(FileInterceptor('image', FILE_INTERCEPTOR_OPTIONS))
  async searchByImage(@UploadedFile() file: Express.Multer.File) {
    const imageBase64 = file.buffer.toString('base64');
    const images = await this.service.searchByImage(imageBase64, file.mimetype);
    return images.map((img) => ({
      id: img.id,
      postId: img.postId,
      imageUrl: img.imageUrl,
      createdAt: img.createdAt,
    }));
  }
}
