import { MigrationInterface, QueryRunner } from 'typeorm';

export class AutoevaluacionCompetencia1788216633644 implements MigrationInterface {
  name = 'AutoevaluacionCompetencia1788216633644';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "autoevaluaciones_competencia" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachee_id" uuid NOT NULL,
        "competencia_id" uuid NOT NULL,
        "nivel" integer NOT NULL,
        "ejemplo" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_autoevaluaciones_competencia" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "autoevaluaciones_competencia" ADD CONSTRAINT "FK_autoevaluaciones_competencia_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "autoevaluaciones_competencia" ADD CONSTRAINT "FK_autoevaluaciones_competencia_competencia" FOREIGN KEY ("competencia_id")
      REFERENCES "competencias"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "autoevaluaciones_competencia"`);
  }
}
