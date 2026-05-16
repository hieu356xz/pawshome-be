import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePermissionAddAssignable1777558825859 implements MigrationInterface {
  name = 'UpdatePermissionAddAssignable1777558825859';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD "assignable" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN "assignable"`,
    );
  }
}
