import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDonationsTables1780509868806 implements MigrationInterface {
  name = 'AddDonationsTables1780509868806';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "donation_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "donation_id" uuid NOT NULL, "reference_number" character varying(255) NOT NULL, "bank_transaction_time" TIMESTAMP NOT NULL, "amount" numeric(12,2) NOT NULL, "sender_account_name" character varying(255), "sender_account_number" character varying(100), "raw_webhook_data" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_dcd17eb27466230b7f25c1065b2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."donations_status_enum" AS ENUM('PENDING', 'PAID', 'CANCELLED', 'EXPIRED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "donations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_code" BIGSERIAL NOT NULL, "user_id" uuid, "amount" numeric(12,2) NOT NULL, "status" "public"."donations_status_enum" NOT NULL DEFAULT 'PENDING', "donor_name" character varying(255), "donor_email" character varying(255), "donor_phone" character varying(20), "message" text, "is_anonymous" boolean NOT NULL DEFAULT false, "payment_link_id" character varying(255), "checkout_url" text, "paid_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9844f4b680aa1d45e74e16518d0" UNIQUE ("order_code"), CONSTRAINT "PK_c01355d6f6f50fc6d1b4a946abf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "donation_transactions" ADD CONSTRAINT "FK_7feeac1131972b54a0acb518950" FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "donations" ADD CONSTRAINT "FK_e0a522570e35074125c86d817ea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "donations" DROP CONSTRAINT "FK_e0a522570e35074125c86d817ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "donation_transactions" DROP CONSTRAINT "FK_7feeac1131972b54a0acb518950"`,
    );
    await queryRunner.query(`DROP TABLE "donations"`);
    await queryRunner.query(`DROP TYPE "public"."donations_status_enum"`);
    await queryRunner.query(`DROP TABLE "donation_transactions"`);
  }
}
