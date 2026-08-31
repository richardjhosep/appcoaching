import { MigrationInterface, QueryRunner } from 'typeorm';

export class RetroalimentacionCierre1788216091915 implements MigrationInterface {
  name = 'RetroalimentacionCierre1788216091915';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "retroalimentaciones_cierre" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachee_id" uuid NOT NULL,
        "ciclo_id" uuid NOT NULL,
        "respuestas" jsonb NOT NULL,
        "lo_que_mas_gusto" text,
        "mayores_aprendizajes" text,
        "sugerencias" text,
        "otros_comentarios" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_retroalimentaciones_cierre" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_retroalimentaciones_cierre_ciclo" UNIQUE ("ciclo_id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "retroalimentaciones_cierre" ADD CONSTRAINT "FK_retroalimentaciones_cierre_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "retroalimentaciones_cierre" ADD CONSTRAINT "FK_retroalimentaciones_cierre_ciclo" FOREIGN KEY ("ciclo_id")
      REFERENCES "ciclos_coaching"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "retroalimentaciones_cierre"`);
  }
}
