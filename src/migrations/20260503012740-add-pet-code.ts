import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPetCode20260503012740 implements MigrationInterface {
  name = 'AddPetCode20260503012740';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pets" ADD "pet_code" character varying(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "pets" ADD CONSTRAINT "UQ_pets_pet_code" UNIQUE ("pet_code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pets" DROP CONSTRAINT "UQ_pets_pet_code"`,
    );
    await queryRunner.query(`ALTER TABLE "pets" DROP COLUMN "pet_code"`);
  }
}
