import { MigrationInterface, QueryRunner } from 'typeorm';

export class RedesSocialesPerfilCoach1788468925351 implements MigrationInterface {
  name = 'RedesSocialesPerfilCoach1788468925351';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "perfiles_coach"
      ADD COLUMN "sitio_web" character varying,
      ADD COLUMN "instagram_url" character varying,
      ADD COLUMN "facebook_url" character varying,
      ADD COLUMN "youtube_url" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "perfiles_coach"
      DROP COLUMN "sitio_web",
      DROP COLUMN "instagram_url",
      DROP COLUMN "facebook_url",
      DROP COLUMN "youtube_url"
    `);
  }
}
