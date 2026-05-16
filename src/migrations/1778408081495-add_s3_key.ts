import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddS3Key1778408081495 implements MigrationInterface {
  name = 'AddS3Key1778408081495';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pet_post_images" ADD "s3_key" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_images" ADD "s3_key" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pet_images" DROP COLUMN "s3_key"`);
    await queryRunner.query(
      `ALTER TABLE "pet_post_images" DROP COLUMN "s3_key"`,
    );
  }
}
