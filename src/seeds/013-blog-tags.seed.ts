import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Tag } from '@modules/blog/entities/tag.entity';
import slugify from 'slugify';

export class BlogTagsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const tagRepo = dataSource.getRepository(Tag);

    const tags = [
      'Kiến thức',
      'Sức khỏe',
      'Dinh dưỡng',
      'Câu chuyện',
      'Nhận nuôi',
      'Huấn luyện',
      'Sự kiện',
    ];

    for (const tagName of tags) {
      const slug = slugify(tagName, { lower: true, locale: 'vi' });
      const existing = await tagRepo.findOne({ where: { slug } });

      if (existing) {
        console.log(`[BlogTagsSeed] Tag already exists: ${tagName}`);
        continue;
      }

      const tag = tagRepo.create({
        name: tagName,
        slug,
      });
      await tagRepo.save(tag);
      console.log(`[BlogTagsSeed] Created tag: ${tagName}`);
    }

    console.log('[BlogTagsSeed] Completed!');
  }
}
