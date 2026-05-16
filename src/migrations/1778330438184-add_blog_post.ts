import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlogPost1778330438184 implements MigrationInterface {
  name = 'AddBlogPost1778330438184';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."blog_posts_status_enum" AS ENUM('draft', 'published', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "blog_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "content" text NOT NULL, "excerpt" text, "status" "public"."blog_posts_status_enum" NOT NULL DEFAULT 'draft', "featured_image_url" text, "view_count" integer NOT NULL DEFAULT '0', "deleted_at" TIMESTAMP, "deleted_by" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5b2818a2c45c3edb9991b1c7a51" UNIQUE ("slug"), CONSTRAINT "PK_dd2add25eac93daefc93da9d387" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "UQ_b3aa10c29ea4e61a830362bd25a" UNIQUE ("slug"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "blog_post_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "blog_post_id" uuid NOT NULL, "user_id" uuid, "parent_id" uuid, "content" text NOT NULL, "is_approved" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP, "deleted_by" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5d2b874a2d28cb147bea267494b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "blog_post_tags" ("blog_post_id" uuid NOT NULL, "tag_id" integer NOT NULL, CONSTRAINT "PK_2779d908a3a70ce4dac0a9463b8" PRIMARY KEY ("blog_post_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_630a67aafd6f4e8e10c3c7423c" ON "blog_post_tags" ("blog_post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92c39b2147baa669d0a77344bd" ON "blog_post_tags" ("tag_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_posts" ADD CONSTRAINT "FK_b15c59c4167f367184e7d5e46e8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_comments" ADD CONSTRAINT "FK_3f3d7e4ba508c900df340dda383" FOREIGN KEY ("blog_post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_comments" ADD CONSTRAINT "FK_7cd6a9df9ffd2ec097fb183e176" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_comments" ADD CONSTRAINT "FK_dfa3aa99e8d29d11e7d8f9fcd35" FOREIGN KEY ("parent_id") REFERENCES "blog_post_comments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_tags" ADD CONSTRAINT "FK_630a67aafd6f4e8e10c3c7423c3" FOREIGN KEY ("blog_post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_tags" ADD CONSTRAINT "FK_92c39b2147baa669d0a77344bd9" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blog_post_tags" DROP CONSTRAINT "FK_92c39b2147baa669d0a77344bd9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_tags" DROP CONSTRAINT "FK_630a67aafd6f4e8e10c3c7423c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_comments" DROP CONSTRAINT "FK_dfa3aa99e8d29d11e7d8f9fcd35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_comments" DROP CONSTRAINT "FK_7cd6a9df9ffd2ec097fb183e176"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_post_comments" DROP CONSTRAINT "FK_3f3d7e4ba508c900df340dda383"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_posts" DROP CONSTRAINT "FK_b15c59c4167f367184e7d5e46e8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92c39b2147baa669d0a77344bd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_630a67aafd6f4e8e10c3c7423c"`,
    );
    await queryRunner.query(`DROP TABLE "blog_post_tags"`);
    await queryRunner.query(`DROP TABLE "blog_post_comments"`);
    await queryRunner.query(`DROP TABLE "tags"`);
    await queryRunner.query(`DROP TABLE "blog_posts"`);
    await queryRunner.query(`DROP TYPE "public"."blog_posts_status_enum"`);
  }
}
