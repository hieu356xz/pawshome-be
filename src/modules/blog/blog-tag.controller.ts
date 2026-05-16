import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BlogTagService } from './blog-tag.service';
import { CreateBlogTagDto, UpdateBlogTagDto } from './dto/blog-tag.dto';
import { Public } from '@/common/decorators/public.decorator';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { PolicyGuard } from '@/common/guards/policy.guard';

@Controller('blog-tags')
@UseGuards(PolicyGuard)
export class BlogTagController {
  constructor(private readonly service: BlogTagService) {}

  @Public()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('blog-tag:create')
  create(@Body() data: CreateBlogTagDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @RequirePermissions('blog-tag:update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateBlogTagDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @RequirePermissions('blog-tag:delete')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
