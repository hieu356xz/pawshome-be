import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPolicyTable1777101244180 implements MigrationInterface {
  name = 'AddPolicyTable1777101244180';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."policies_effect_enum" AS ENUM('ALLOW', 'DENY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "policies" ("roleId" uuid NOT NULL, "permissionId" uuid NOT NULL, "effect" "public"."policies_effect_enum" NOT NULL DEFAULT 'ALLOW', "conditions" json, "priority" integer NOT NULL DEFAULT '10', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2612f9c55a5b98a9649c4314ed5" PRIMARY KEY ("roleId", "permissionId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2612f9c55a5b98a9649c4314ed" ON "policies" ("roleId", "permissionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "policies" ADD CONSTRAINT "FK_f86467860a0ec1d2a82ad3a381f" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "policies" ADD CONSTRAINT "FK_581d5bdbc3e6de2cd07b9d2e363" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "policies" DROP CONSTRAINT "FK_581d5bdbc3e6de2cd07b9d2e363"`,
    );
    await queryRunner.query(
      `ALTER TABLE "policies" DROP CONSTRAINT "FK_f86467860a0ec1d2a82ad3a381f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2612f9c55a5b98a9649c4314ed"`,
    );
    await queryRunner.query(`DROP TABLE "policies"`);
    await queryRunner.query(`DROP TYPE "public"."policies_effect_enum"`);
  }
}
