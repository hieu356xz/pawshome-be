import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PolicyEffect } from '../enums/policy-effect.enum';
import type { PolicyConditions } from '@modules/policy/interfaces/policy-condition.interface';
import { Role } from '@modules/role/entities/role.entity';
import { Permission } from '@modules/permission/entities/permission.entity';

@Entity('policies')
@Index(['roleId', 'permissionId'])
export class Policy {
  @PrimaryColumn()
  roleId!: string;

  @PrimaryColumn()
  permissionId!: string;

  @Column({
    type: 'enum',
    enum: PolicyEffect,
    default: PolicyEffect.ALLOW,
  })
  effect!: PolicyEffect;

  @Column({ type: 'json', nullable: true })
  conditions!: PolicyConditions | null;

  @Column({ default: 10 })
  priority!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Role, (role) => role.policies, { onDelete: 'CASCADE' })
  role!: Role;

  @ManyToOne(() => Permission, (permission) => permission.policies, {
    onDelete: 'CASCADE',
  })
  permission!: Permission;
}
