import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAdoptionRequest1778768730700 implements MigrationInterface {
  name = 'UpdateAdoptionRequest1778768730700';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" ADD "approval_message" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" ADD "rejection_note" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" DROP COLUMN "rejection_reason"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."adoption_requests_rejection_reason_enum" AS ENUM('NOT_ENOUGH_EXPERIENCE', 'INSUFFICIENT_LIVING_SPACE', 'NO_YARD_FOR_PET', 'FINANCIAL_UNSTABLE', 'COMMITMENT_QUESTIONS', 'OTHER_PETS_INCOMPATIBLE', 'PET_ALREADY_ADOPTED', 'INCOMPLETE_APPLICATION', 'OTHER_REQUEST_APPROVED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" ADD "rejection_reason" "public"."adoption_requests_rejection_reason_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" DROP COLUMN "rejection_reason"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."adoption_requests_rejection_reason_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" ADD "rejection_reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" DROP COLUMN "rejection_note"`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" DROP COLUMN "approval_message"`,
    );
  }
}
