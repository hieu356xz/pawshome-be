import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { PetPost } from './pet-post.entity';

@Entity('pet_post_images')
export class PetPostImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'post_id' })
  postId!: string;

  @ManyToOne(() => PetPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: PetPost;

  @Column({ name: 'image_url' })
  imageUrl!: string;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'vector', length: 1536, nullable: true })
  embedding!: number[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
