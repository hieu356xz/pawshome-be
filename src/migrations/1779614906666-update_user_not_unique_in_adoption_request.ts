import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserNotUniqueInAdoptionRequest1779614906666 implements MigrationInterface {
  name = 'UpdateUserNotUniqueInAdoptionRequest1779614906666';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" DROP CONSTRAINT "FK_7c528230f771eb57001e375db9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" DROP CONSTRAINT "REL_7c528230f771eb57001e375db9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" ADD CONSTRAINT "FK_7c528230f771eb57001e375db9d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" DROP CONSTRAINT "FK_7c528230f771eb57001e375db9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" ADD CONSTRAINT "REL_7c528230f771eb57001e375db9" UNIQUE ("user_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "adoption_requests" ADD CONSTRAINT "FK_7c528230f771eb57001e375db9d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
