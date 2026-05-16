import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMedicalRecord1777829378792 implements MigrationInterface {
  name = 'AddMedicalRecord1777829378792';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."medical_records_record_type_enum" AS ENUM('vaccination', 'medication', 'checkup', 'surgery', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."medical_records_currency_enum" AS ENUM('vnd', 'usd')`,
    );
    await queryRunner.query(
      `CREATE TABLE "medical_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pet_id" uuid NOT NULL, "record_type" "public"."medical_records_record_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "record_date" date NOT NULL, "cost" numeric(10,2), "currency" "public"."medical_records_currency_enum", "veterinarian" character varying(255), "diagnosis" text, "treatment" text, "next_due_date" date, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c200c0b76638124b7ed51424823" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_records" ADD CONSTRAINT "FK_00f48fa86cd43404c7c3f1cf691" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "medical_records" DROP CONSTRAINT "FK_00f48fa86cd43404c7c3f1cf691"`,
    );
    await queryRunner.query(`DROP TABLE "medical_records"`);
    await queryRunner.query(
      `DROP TYPE "public"."medical_records_currency_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."medical_records_record_type_enum"`,
    );
  }
}
