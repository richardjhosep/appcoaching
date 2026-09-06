import { MigrationInterface, QueryRunner } from 'typeorm';

export class PerfilPersonalCoachee1788740000000 implements MigrationInterface {
  name = 'PerfilPersonalCoachee1788740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "coachees"
      ADD "foto_path" character varying,
      ADD "foto_nombre" character varying,
      ADD "bio" text,
      ADD "compartir_perfil_con_coach" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "coachees"
      DROP COLUMN "compartir_perfil_con_coach",
      DROP COLUMN "bio",
      DROP COLUMN "foto_nombre",
      DROP COLUMN "foto_path"
    `);
  }
}
