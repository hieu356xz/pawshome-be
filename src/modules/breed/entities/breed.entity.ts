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

@Entity('breeds')
export class Breed {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'species_id' })
  speciesId!: number;

  @ManyToOne(() => Species, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'species_id' })
  species!: Species;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
