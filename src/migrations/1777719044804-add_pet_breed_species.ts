import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPetBreedSpecies1777719044804 implements MigrationInterface {
  name = 'AddPetBreedSpecies1777719044804';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "species" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1adf701cac3b2c0f8bacb54774b" UNIQUE ("name"), CONSTRAINT "PK_ae6a87f2423ba6c25dc43c32770" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "breeds" ("id" SERIAL NOT NULL, "species_id" integer NOT NULL, "name" character varying(255) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e89f6e1fbb29d28623b4feb2b3e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pets_gender_enum" AS ENUM('male', 'female', 'unknown')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pets_age_group_enum" AS ENUM('newborn', 'young', 'adult', 'senior')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pets_adoption_status_enum" AS ENUM('new_intake', 'seeking', 'pending', 'foster', 'adopted', 'permanent_foster')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "species_id" integer NOT NULL, "breed_id" integer, "gender" "public"."pets_gender_enum" NOT NULL, "age_group" "public"."pets_age_group_enum" NOT NULL, "color" character varying(100) NOT NULL, "weight" numeric(5,2), "adoption_status" "public"."pets_adoption_status_enum" NOT NULL, "description" text, "intake_date" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d01e9e7b4ada753c826720bee8b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "policies" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "breeds" ADD CONSTRAINT "FK_0ea3bf7a9569bb26556fb5a7fb2" FOREIGN KEY ("species_id") REFERENCES "species"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pets" ADD CONSTRAINT "FK_bf445ad6aa656e5953c4e90c5a0" FOREIGN KEY ("species_id") REFERENCES "species"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pets" ADD CONSTRAINT "FK_478d65b6063e614271e7d4bebad" FOREIGN KEY ("breed_id") REFERENCES "breeds"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pets" DROP CONSTRAINT "FK_478d65b6063e614271e7d4bebad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pets" DROP CONSTRAINT "FK_bf445ad6aa656e5953c4e90c5a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "breeds" DROP CONSTRAINT "FK_0ea3bf7a9569bb26556fb5a7fb2"`,
    );
    await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN "updated_at"`);
    await queryRunner.query(`DROP TABLE "pets"`);
    await queryRunner.query(`DROP TYPE "public"."pets_adoption_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."pets_age_group_enum"`);
    await queryRunner.query(`DROP TYPE "public"."pets_gender_enum"`);
    await queryRunner.query(`DROP TABLE "breeds"`);
    await queryRunner.query(`DROP TABLE "species"`);
  }
}
