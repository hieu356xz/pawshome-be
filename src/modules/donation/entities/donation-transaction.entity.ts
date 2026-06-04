import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Donation } from './donation.entity';

@Entity('donation_transactions')
export class DonationTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'donation_id', type: 'uuid' })
  donationId!: string;

  @ManyToOne(() => Donation, (donation) => donation.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'donation_id' })
  donation!: Donation;

  @Column({ name: 'reference_number', type: 'varchar', length: 255 })
  referenceNumber!: string;

  @Column({ name: 'bank_transaction_time', type: 'timestamp' })
  bankTransactionTime!: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ name: 'sender_account_name', type: 'varchar', length: 255, nullable: true })
  senderAccountName!: string | null;

  @Column({ name: 'sender_account_number', type: 'varchar', length: 100, nullable: true })
  senderAccountNumber!: string | null;

  @Column({ name: 'raw_webhook_data', type: 'text' })
  rawWebhookData!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
