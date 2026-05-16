import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPetPost1778327564089 implements MigrationInterface {
  name = 'AddPetPost1778327564089';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."pet_posts_post_type_enum" AS ENUM('lost', 'found')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pet_posts_post_status_enum" AS ENUM('active', 'closed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pet_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "post_type" "public"."pet_posts_post_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "description" text, "location" character varying(255), "contact" character varying(255) NOT NULL, "post_status" "public"."pet_posts_post_status_enum" NOT NULL DEFAULT 'active', "deleted_at" TIMESTAMP, "deleted_by" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0be42d1d9eb18f7c31b1f170437" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pet_post_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "user_id" uuid NOT NULL, "parent_id" uuid, "comment" text NOT NULL, "deleted_at" TIMESTAMP, "deleted_by" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_38fd31ca8aef885e614c574ee50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pet_post_images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "image_url" character varying NOT NULL, "embedding" vector(1536), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb2e0dc4335a10d8fb65620d806" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_posts" ADD CONSTRAINT "FK_e179d1ee0f7d2ba8a31ec9ced29" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_post_comments" ADD CONSTRAINT "FK_609361bfe92771030c6d6e41cd3" FOREIGN KEY ("post_id") REFERENCES "pet_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_post_comments" ADD CONSTRAINT "FK_3ddd13226941b34d4bf7393a0e7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_post_comments" ADD CONSTRAINT "FK_1e7c15707d79e92ce3145ecb168" FOREIGN KEY ("parent_id") REFERENCES "pet_post_comments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_post_images" ADD CONSTRAINT "FK_8aaf197fcbb7149313789fe4bb5" FOREIGN KEY ("post_id") REFERENCES "pet_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pet_post_images" DROP CONSTRAINT "FK_8aaf197fcbb7149313789fe4bb5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_post_comments" DROP CONSTRAINT "FK_1e7c15707d79e92ce3145ecb168"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_post_comments" DROP CONSTRAINT "FK_3ddd13226941b34d4bf7393a0e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_post_comments" DROP CONSTRAINT "FK_609361bfe92771030c6d6e41cd3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pet_posts" DROP CONSTRAINT "FK_e179d1ee0f7d2ba8a31ec9ced29"`,
    );
    await queryRunner.query(`DROP TABLE "pet_post_images"`);
    await queryRunner.query(`DROP TABLE "pet_post_comments"`);
    await queryRunner.query(`DROP TABLE "pet_posts"`);
    await queryRunner.query(`DROP TYPE "public"."pet_posts_post_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."pet_posts_post_type_enum"`);
  }
}
