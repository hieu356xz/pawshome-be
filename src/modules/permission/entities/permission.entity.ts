import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { PermissionKey } from '../enums/permission-key.enum';
import { Role } from '@modules/role/entities/role.entity';
import { Policy } from './policy.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: PermissionKey;

  @Column()
  description!: string;

  @Column({ default: true })
  assignable!: boolean;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];

  @OneToMany(() => Policy, (policy) => policy.permission)
  policies!: Policy[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
