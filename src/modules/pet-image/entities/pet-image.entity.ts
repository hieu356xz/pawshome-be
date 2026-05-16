import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Pet } from '@modules/pet/entities/pet.entity';

@Entity('pet_images')
export class PetImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pet_id' })
  petId!: string;

  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet!: Pet;

  @Column({ name: 'image_url' })
  imageUrl!: string;

  @Column({ name: 's3_key', nullable: true })
  s3Key?: string;

  @Exclude({ toPlainOnly: true })
  @Column({ type: 'vector', length: 1536, nullable: true })
  embedding!: number[] | null;

  @Column({ name: 'is_primary', default: false })
  isPrimary!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
