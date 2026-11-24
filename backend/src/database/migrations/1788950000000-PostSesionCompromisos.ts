import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostSesionCompromisos1788950000000 implements MigrationInterface {
  name = 'PostSesionCompromisos1788950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_sesiones" ADD COLUMN "compromisos" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_sesiones" DROP COLUMN "compromisos"`,
    );
  }
}
