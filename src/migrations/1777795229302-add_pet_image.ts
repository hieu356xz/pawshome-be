import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPetImage1777795229302 implements MigrationInterface {
  name = 'AddPetImage1777795229302';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await queryRunner.query(
      `CREATE TABLE "pet_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pet_id" uuid NOT NULL, "image_url" character varying NOT NULL, "embedding" vector(1536), "is_primary" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_775f799e0181f91eefaa6ccd1de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_images" ADD CONSTRAINT "FK_046611b2e97890ef9c8649d2e0b" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pet_images" DROP CONSTRAINT "FK_046611b2e97890ef9c8649d2e0b"`,
    );
    await queryRunner.query(`DROP TABLE "pet_images"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
  }
}
