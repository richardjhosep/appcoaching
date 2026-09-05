import { MigrationInterface, QueryRunner } from 'typeorm';

export class PerfilCoach1788462867393 implements MigrationInterface {
  name = 'PerfilCoach1788462867393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "perfiles_coach" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coach_user_id" uuid NOT NULL,
        "nombre" character varying NOT NULL DEFAULT '',
        "titulo" character varying,
        "bio" text,
        "linkedin_url" character varying,
        "telefono" character varying,
        "email_contacto" character varying,
        "metodologia" text,
        "foto_path" character varying,
        "foto_nombre" character varying,
        "cv_path" character varying,
        "cv_nombre" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_perfiles_coach" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_perfiles_coach_coach_user_id" UNIQUE ("coach_user_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "certificaciones_coach" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "perfil_coach_id" uuid NOT NULL,
        "nombre" character varying NOT NULL,
        "entidad_emisora" character varying,
        "fecha" date,
        "archivo_path" character varying,
        "archivo_nombre" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_certificaciones_coach" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "certificaciones_coach" ADD CONSTRAINT "FK_certificaciones_coach_perfil" FOREIGN KEY ("perfil_coach_id")
      REFERENCES "perfiles_coach"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "certificaciones_coach" DROP CONSTRAINT "FK_certificaciones_coach_perfil"`,
    );
    await queryRunner.query(`DROP TABLE "certificaciones_coach"`);
    await queryRunner.query(`DROP TABLE "perfiles_coach"`);
  }
}
