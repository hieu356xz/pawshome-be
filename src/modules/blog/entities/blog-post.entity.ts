import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { User } from '@modules/user/entities/user.entity';
import { Tag } from './tag.entity';
import { BlogPostStatus } from '../enums/blog-post-status.enum';

@Entity('blog_posts')
export class BlogPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ length: 255 })
  title!: string;

  @Column({ unique: true, length: 255 })
  slug!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  excerpt!: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: BlogPostStatus,
    default: BlogPostStatus.DRAFT,
  })
  status!: BlogPostStatus;

  @Column({ name: 'featured_image_url', type: 'text', nullable: true })
  featuredImageUrl!: string | null;

  @Column({ name: 'view_count', default: 0 })
  viewCount!: number;

  @ManyToMany(() => Tag, (tag) => tag.posts, { eager: true })
  @JoinTable({
    name: 'blog_post_tags',
    joinColumn: { name: 'blog_post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  @Exclude({ toPlainOnly: true })
  deletedAt!: Date | null;

  @Column({ name: 'deleted_by', type: 'text', nullable: true })
  deletedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Expose()
  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
