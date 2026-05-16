import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePetDetail1778925280296 implements MigrationInterface {
  name = 'UpdatePetDetail1778925280296';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pets" ADD "is_vaccinated" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "pets" ADD "is_neutered" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "pets" ADD "health_summary" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pets" DROP COLUMN "health_summary"`);
    await queryRunner.query(`ALTER TABLE "pets" DROP COLUMN "is_neutered"`);
    await queryRunner.query(`ALTER TABLE "pets" DROP COLUMN "is_vaccinated"`);
  }
}
