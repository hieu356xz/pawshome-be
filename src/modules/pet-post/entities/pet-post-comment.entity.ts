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
import { User } from '@modules/user/entities/user.entity';
import { PetPost } from './pet-post.entity';
import { Exclude, Expose } from 'class-transformer';

@Entity('pet_post_comments')
export class PetPostComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'post_id' })
  postId!: string;

  @ManyToOne(() => PetPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: PetPost;

  @Column({ name: 'user_id', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ name: 'parent_id', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => PetPostComment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent!: PetPostComment | null;

  @OneToMany(() => PetPostComment, (comment) => comment.parent)
  replies!: PetPostComment[];

  @Column({ type: 'text' })
  content!: string;

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
