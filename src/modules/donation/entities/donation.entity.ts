import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@modules/user/entities/user.entity';
import { DonationStatus } from '../enums/donation-status.enum';
import { DonationTransaction } from './donation-transaction.entity';

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_code', type: 'bigint', unique: true })
  @Generated('increment')
  orderCode!: number;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.PENDING,
  })
  status!: DonationStatus;

  @Column({ name: 'donor_name', type: 'varchar', length: 255, nullable: true })
  donorName!: string | null;

  @Column({ name: 'donor_email', type: 'varchar', length: 255, nullable: true })
  donorEmail!: string | null;

  @Column({ name: 'donor_phone', type: 'varchar', length: 20, nullable: true })
  donorPhone!: string | null;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({ name: 'is_anonymous', type: 'boolean', default: false })
  isAnonymous!: boolean;

  @Column({ name: 'payment_link_id', type: 'varchar', length: 255, nullable: true })
  paymentLinkId!: string | null;

  @Column({ name: 'checkout_url', type: 'text', nullable: true })
  checkoutUrl!: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => DonationTransaction, (transaction) => transaction.donation)
  transactions!: DonationTransaction[];
}
