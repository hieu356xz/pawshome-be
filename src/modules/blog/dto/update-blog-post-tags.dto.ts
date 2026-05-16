import { IsArray, IsNumber } from 'class-validator';

export class UpdateBlogPostTagsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds!: number[];
}
