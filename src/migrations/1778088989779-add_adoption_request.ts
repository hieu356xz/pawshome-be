import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdoptionRequest1778088989779 implements MigrationInterface {
  name = 'AddAdoptionRequest1778088989779';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."medical_records_record_type_enum" AS ENUM('vaccination', 'medication', 'checkup', 'surgery', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."medical_records_currency_enum" AS ENUM('vnd', 'usd')`,
    );
    await queryRunner.query(
      `CREATE TABLE "medical_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "pet_id" uuid NOT NULL, "veterinarian_id" uuid, "record_type" "public"."medical_records_record_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "record_date" date NOT NULL, "cost" numeric(10,2), "currency" "public"."medical_records_currency_enum", "diagnosis" text, "treatment" text, "next_due_date" date, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c200c0b76638124b7ed51424823" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."adoption_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "adoption_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "pet_id" uuid NOT NULL, "status" "public"."adoption_requests_status_enum" NOT NULL DEFAULT 'pending', "applicant_name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20), "address" text, "reason" text NOT NULL, "experience" text, "has_other_pets" boolean NOT NULL DEFAULT false, "other_pets_detail" text, "living_situation" character varying(255), "has_yard" boolean NOT NULL DEFAULT false, "commitment" text, "rejection_reason" text, "reviewed_by" text, "reviewed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_7c528230f771eb57001e375db9" UNIQUE ("user_id"), CONSTRAINT "PK_b62df67d1dc523ee76efc9793b0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_records" ADD CONSTRAINT "FK_00f48fa86cd43404c7c3f1cf691" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_records" ADD CONSTRAINT "FK_76de7b6fc662bd9b2777f7696a4" FOREIGN KEY ("veterinarian_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" ADD CONSTRAINT "FK_7c528230f771eb57001e375db9d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" ADD CONSTRAINT "FK_c3c6e3068067af06c5523d6cb85" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" DROP CONSTRAINT "FK_c3c6e3068067af06c5523d6cb85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" DROP CONSTRAINT "FK_7c528230f771eb57001e375db9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_records" DROP CONSTRAINT "FK_76de7b6fc662bd9b2777f7696a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "medical_records" DROP CONSTRAINT "FK_00f48fa86cd43404c7c3f1cf691"`,
    );
    await queryRunner.query(`DROP TABLE "adoption_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."adoption_requests_status_enum"`,
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
