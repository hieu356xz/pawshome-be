import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePolicyAddUpdatedAt1777668568267 implements MigrationInterface {
    name = 'UpdatePolicyAddUpdatedAt1777668568267'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "policies" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "policies" DROP COLUMN "updated_at"`);
    }

}
