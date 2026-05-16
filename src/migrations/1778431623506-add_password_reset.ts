import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordReset1778431623506 implements MigrationInterface {
  name = 'AddPasswordReset1778431623506';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "password_resets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "used_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_f7a4c3bc48f24df007936d217be" UNIQUE ("user_id"), CONSTRAINT "REL_f7a4c3bc48f24df007936d217b" UNIQUE ("user_id"), CONSTRAINT "PK_4816377aa98211c1de34469e742" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_resets" ADD CONSTRAINT "FK_f7a4c3bc48f24df007936d217be" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_resets" DROP CONSTRAINT "FK_f7a4c3bc48f24df007936d217be"`,
    );
    await queryRunner.query(`DROP TABLE "password_resets"`);
  }
}
