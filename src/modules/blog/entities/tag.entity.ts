import { Column, Entity, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { BlogPost } from './blog-post.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ unique: true, length: 100 })
  slug!: string;

  @ManyToMany(() => BlogPost, (post) => post.tags)
  posts!: BlogPost[];
}
