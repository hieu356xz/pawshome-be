import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserBan1778918531786 implements MigrationInterface {
  name = 'AddUserBan1778918531786';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "banned_at" date`);
    await queryRunner.query(`ALTER TABLE "users" ADD "ban_reason" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "banned_by" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "banned_by"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "ban_reason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "banned_at"`);
  }
}
