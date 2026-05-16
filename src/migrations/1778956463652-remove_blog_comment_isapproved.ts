import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveBlogCommentIsapproved1778956463652 implements MigrationInterface {
  name = 'RemoveBlogCommentIsapproved1778956463652';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blog_post_comments" DROP COLUMN "is_approved"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blog_post_comments" ADD "is_approved" boolean NOT NULL DEFAULT false`,
    );
  }
}
