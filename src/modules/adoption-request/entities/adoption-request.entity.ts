import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pet } from '@modules/pet/entities/pet.entity';
import { User } from '@modules/user/entities/user.entity';
import { AdoptionRequestStatus } from '../enums/adoption-request-status.enum';

@Entity('adoption_requests')
export class AdoptionRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'pet_id' })
  petId!: string;

  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet!: Pet;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AdoptionRequestStatus,
    default: AdoptionRequestStatus.PENDING,
  })
  status!: AdoptionRequestStatus;

  @Column({ name: 'applicant_name', length: 255 })
  applicantName!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ name: 'reason', type: 'text' })
  reason!: string;

  @Column({ type: 'text', nullable: true })
  experience!: string | null;

  @Column({ name: 'has_other_pets', default: false })
  hasOtherPets!: boolean;

  @Column({ name: 'other_pets_detail', type: 'text', nullable: true })
  otherPetsDetail!: string | null;

  @Column({
    name: 'living_situation',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  livingSituation!: string | null;

  @Column({ name: 'has_yard', default: false })
  hasYard!: boolean;

  @Column({ name: 'commitment', type: 'text', nullable: true })
  commitment!: string | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @Column({ name: 'reviewed_by', type: 'text', nullable: true })
  reviewedBy!: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
