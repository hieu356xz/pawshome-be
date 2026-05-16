import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { User } from '@modules/user/entities/user.entity';
import { BlogPost } from './blog-post.entity';

@Entity('blog_post_comments')
export class BlogPostComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'blog_post_id' })
  blogPostId!: string;

  @ManyToOne(() => BlogPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blog_post_id' })
  blogPost!: BlogPost;

  @Column({ name: 'user_id', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ name: 'parent_id', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => BlogPostComment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent!: BlogPostComment | null;

  @OneToMany(() => BlogPostComment, (comment) => comment.parent)
  replies!: BlogPostComment[];

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'is_approved', default: false })
  isApproved!: boolean;

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
