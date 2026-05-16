import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '@modules/user/entities/user.entity';
import { PostType } from '../enums/post-type.enum';
import { PostStatus } from '../enums/post-status.enum';
import { Exclude, Expose } from 'class-transformer';

@Entity('pet_posts')
export class PetPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    name: 'post_type',
    type: 'enum',
    enum: PostType,
  })
  postType!: PostType;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ length: 255 })
  contact!: string;

  @Column({
    name: 'post_status',
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.ACTIVE,
  })
  postStatus!: PostStatus;

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
