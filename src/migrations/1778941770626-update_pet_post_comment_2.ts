import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePetPostComment21778941770626 implements MigrationInterface {
    name = 'UpdatePetPostComment21778941770626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pet_post_comments" RENAME COLUMN "comment" TO "content"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pet_post_comments" RENAME COLUMN "content" TO "comment"`);
    }

}
