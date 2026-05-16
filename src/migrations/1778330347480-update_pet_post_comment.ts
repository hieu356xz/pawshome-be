import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePetPostComment1778330347480 implements MigrationInterface {
    name = 'UpdatePetPostComment1778330347480'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pet_post_comments" DROP CONSTRAINT "FK_3ddd13226941b34d4bf7393a0e7"`);
        await queryRunner.query(`ALTER TABLE "pet_post_comments" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pet_post_comments" ADD CONSTRAINT "FK_3ddd13226941b34d4bf7393a0e7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pet_post_comments" DROP CONSTRAINT "FK_3ddd13226941b34d4bf7393a0e7"`);
        await queryRunner.query(`ALTER TABLE "pet_post_comments" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "pet_post_comments" ADD CONSTRAINT "FK_3ddd13226941b34d4bf7393a0e7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
