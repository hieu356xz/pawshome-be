import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BlogPostService } from './blog-post.service';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
} from './dto/create-blog-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdateBlogPostTagsDto } from './dto/update-blog-post-tags.dto';
import { QueryBlogPostDto } from './dto/blog-post-query.dto';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { Public } from '@/common/decorators/public.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PolicyGuard } from '@/common/guards/policy.guard';
import { EntityExistGuard } from '@/common/guards/entity-exist.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { UserPayload } from '@modules/auth/interfaces/user-payload.interface';
import { BlogPost } from './entities/blog-post.entity';
import { BlogPostComment } from './entities/blog-post-comment.entity';

const FILE_INTERCEPTOR_OPTIONS = {
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (
    _req: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new BadRequestException('Only image files are allowed'), false);
    }
  },
};

@Controller('blog')
export class BlogPostController {
  constructor(private readonly service: BlogPostService) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryBlogPostDto) {
    return this.service.findAll(query);
  }

  @Public()
  @Get('tags')
  getTags() {
    return this.service.getTags();
  }

  @Public()
  @Get(':id')
  @UseGuards(
    EntityExistGuard(BlogPost, {
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
  @RequirePermissions('blog:create')
  create(@CurrentUser() user: UserPayload, @Body() data: CreateBlogPostDto) {
    return this.service.create(user.userId, data);
  }

  @Put(':id')
  @UseGuards(
    EntityExistGuard(BlogPost, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('blog:update')
  update(@Param() { id }: IdParamDto, @Body() data: UpdateBlogPostDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(BlogPost, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('blog:delete')
  remove(@Param() { id }: IdParamDto, @CurrentUser() user: UserPayload) {
    return this.service.remove(id, user.userId);
  }

  @Put(':id/tags')
  @UseGuards(
    EntityExistGuard(BlogPost, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('blog:update')
  updateTags(@Param() { id }: IdParamDto, @Body() data: UpdateBlogPostTagsDto) {
    return this.service.updateTags(id, data.tagIds);
  }

  @Post(':id/featured-image')
  @UseInterceptors(FileInterceptor('image', FILE_INTERCEPTOR_OPTIONS))
  @UseGuards(
    EntityExistGuard(BlogPost, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('blog:update')
  uploadFeaturedImage(
    @Param() { id }: IdParamDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadFeaturedImage(id, file);
  }

  @Delete(':id/featured-image')
  @UseGuards(
    EntityExistGuard(BlogPost, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
      dbField: 'id',
    }),
    PolicyGuard,
  )
  @RequirePermissions('blog:update')
  removeFeaturedImage(@Param() { id }: IdParamDto) {
    return this.service.removeFeaturedImage(id);
  }
}

@Controller('blog/:postId/comments')
export class BlogPostCommentController {
  constructor(private readonly service: BlogPostService) {}

  @Public()
  @Get()
  findAllComments(@Param('postId') postId: string) {
    return this.service.getComments(postId);
  }

  @Post()
  @UseGuards(PolicyGuard)
  @RequirePermissions('blog-comment:create')
  create(
    @Param('postId') postId: string,
    @CurrentUser() user: UserPayload,
    @Body() data: CreateCommentDto,
  ) {
    return this.service.addComment(postId, user.userId, data);
  }

  @Put(':id')
  @UseGuards(
    EntityExistGuard(BlogPostComment, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('blog-comment:update')
  update(
    @Param() { id }: IdParamDto,
    @CurrentUser() user: UserPayload,
    @Body() data: UpdateCommentDto,
  ) {
    return this.service.updateComment(id, user.userId, data);
  }

  @Delete(':id')
  @UseGuards(
    EntityExistGuard(BlogPostComment, {
      source: 'params',
      sourceField: 'id',
      dto: IdParamDto,
    }),
    PolicyGuard,
  )
  @RequirePermissions('blog-comment:delete')
  remove(@Param() { id }: IdParamDto, @CurrentUser() user: UserPayload) {
    return this.service.deleteComment(id, user.userId);
  }
}
