import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPostService } from './blog-post.service';
import {
  BlogPostController,
  BlogPostCommentController,
} from './blog-post.controller';
import { BlogPost } from './entities/blog-post.entity';
import { BlogPostComment } from './entities/blog-post-comment.entity';
import { Tag } from './entities/tag.entity';
import { StorageService } from '@common/services/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPost, BlogPostComment, Tag])],
  controllers: [BlogPostController, BlogPostCommentController],
  providers: [BlogPostService, StorageService],
  exports: [BlogPostService],
})
export class BlogModule {}
