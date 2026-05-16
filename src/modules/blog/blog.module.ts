import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPostService } from './blog-post.service';
import { BlogTagService } from './blog-tag.service';
import {
  BlogPostController,
  BlogPostCommentController,
} from './blog-post.controller';
import { BlogTagController } from './blog-tag.controller';
import { BlogPost } from './entities/blog-post.entity';
import { BlogPostComment } from './entities/blog-post-comment.entity';
import { Tag } from './entities/tag.entity';
import { StorageService } from '@common/services/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost, BlogPostComment, Tag])],
  controllers: [
    BlogPostController,
    BlogPostCommentController,
    BlogTagController,
  ],
  providers: [BlogPostService, BlogTagService, StorageService],
  exports: [BlogPostService, BlogTagService],
})
export class BlogModule {}
