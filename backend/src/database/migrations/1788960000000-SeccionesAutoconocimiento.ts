import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeccionesAutoconocimiento1788960000000 implements MigrationInterface {
  name = 'SeccionesAutoconocimiento1788960000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "secciones_autoconocimiento" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachee_id" uuid NOT NULL,
        "seccion" character varying NOT NULL,
        "contenido" text NOT NULL DEFAULT '',
        "complemento" text NOT NULL DEFAULT '',
        "compartida" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_secciones_autoconocimiento" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_secciones_autoconocimiento_coachee_seccion" UNIQUE ("coachee_id", "seccion"),
        CONSTRAINT "FK_secciones_autoconocimiento_coachee" FOREIGN KEY ("coachee_id")
          REFERENCES "coachees"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "secciones_autoconocimiento"`);
  }
}
