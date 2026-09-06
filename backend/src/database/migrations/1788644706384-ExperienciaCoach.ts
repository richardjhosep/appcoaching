import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExperienciaCoach1788644706384 implements MigrationInterface {
  name = 'ExperienciaCoach1788644706384';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "experiencias_coach" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "perfil_coach_id" uuid NOT NULL,
        "empresa" character varying NOT NULL,
        "cargo" character varying,
        "fecha_inicio" date NOT NULL,
        "fecha_fin" date,
        "descripcion" text,
        "logo_path" character varying,
        "logo_nombre" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_experiencias_coach" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "experiencias_coach" ADD CONSTRAINT "FK_experiencias_coach_perfil" FOREIGN KEY ("perfil_coach_id")
      REFERENCES "perfiles_coach"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "experiencias_coach" DROP CONSTRAINT "FK_experiencias_coach_perfil"`,
    );
    await queryRunner.query(`DROP TABLE "experiencias_coach"`);
  }
}
