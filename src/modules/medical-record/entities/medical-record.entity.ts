import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pet } from '@modules/pet/entities/pet.entity';
import { User } from '@modules/user/entities/user.entity';
import { MedicalRecordType } from '../enums/medical-record-type.enum';
import { Currency } from '../enums/currency.enum';

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'pet_id' })
  petId!: string;

  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet!: Pet;

  @Column({ name: 'veterinarian_id', nullable: true })
  veterinarianId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian!: User | null;

  @Column({
    name: 'record_type',
    type: 'enum',
    enum: MedicalRecordType,
  })
  recordType!: MedicalRecordType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'record_date', type: 'date' })
  recordDate!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost!: number | null;

  @Column({
    type: 'enum',
    enum: Currency,
    nullable: true,
  })
  currency!: Currency | null;

  @Column({ type: 'text', nullable: true })
  diagnosis!: string | null;

  @Column({ type: 'text', nullable: true })
  treatment!: string | null;

  @Column({ name: 'next_due_date', type: 'date', nullable: true })
  nextDueDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
