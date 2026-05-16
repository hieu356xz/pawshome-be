import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Species } from '@modules/species/entities/species.entity';
import { Breed } from '@modules/breed/entities/breed.entity';
import { PetGender } from '../enums/pet-gender.enum';
import { PetAgeGroup } from '../enums/pet-age-group.enum';
import { AdoptionStatus } from '../enums/adoption-status.enum';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'species_id' })
  speciesId!: number;

  @ManyToOne(() => Species, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'species_id' })
  species!: Species;

  @Column({ name: 'breed_id', nullable: true })
  breedId!: number | null;

  @ManyToOne(() => Breed, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'breed_id' })
  breed!: Breed | null;

  @Column({ type: 'enum', enum: PetGender })
  gender!: PetGender;

  @Column({
    name: 'age_group',
    type: 'enum',
    enum: PetAgeGroup,
  })
  ageGroup!: PetAgeGroup;

  @Column({ length: 100 })
  color!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight!: number | null;

  @Column({
    name: 'adoption_status',
    type: 'enum',
    enum: AdoptionStatus,
  })
  adoptionStatus!: AdoptionStatus;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'intake_date', type: 'date' })
  intakeDate!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
