import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRoleAndUser1777295940520 implements MigrationInterface {
    name = 'UpdateRoleAndUser1777295940520'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "description"`);
    }

}
