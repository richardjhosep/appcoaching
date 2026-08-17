import { MigrationInterface, QueryRunner } from 'typeorm';

export class Quiz1786844497279 implements MigrationInterface {
  name = 'Quiz1786844497279';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "quizzes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titulo" character varying NOT NULL,
        "competencia_id" uuid NOT NULL,
        "recurso_id" uuid,
        "activo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quizzes" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "preguntas_quiz" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quiz_id" uuid NOT NULL,
        "enunciado" text NOT NULL,
        "opciones" jsonb NOT NULL,
        "respuesta_correcta" integer NOT NULL,
        "orden" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_preguntas_quiz" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "intentos_quiz" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quiz_id" uuid NOT NULL,
        "coachee_id" uuid NOT NULL,
        "respuestas" jsonb NOT NULL,
        "puntaje" integer NOT NULL,
        "total_preguntas" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_intentos_quiz" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "quizzes" ADD CONSTRAINT "FK_quizzes_competencia" FOREIGN KEY ("competencia_id")
      REFERENCES "competencias"("id") ON DELETE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "quizzes" ADD CONSTRAINT "FK_quizzes_recurso" FOREIGN KEY ("recurso_id")
      REFERENCES "recursos"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "preguntas_quiz" ADD CONSTRAINT "FK_preguntas_quiz_quiz" FOREIGN KEY ("quiz_id")
      REFERENCES "quizzes"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "intentos_quiz" ADD CONSTRAINT "FK_intentos_quiz_quiz" FOREIGN KEY ("quiz_id")
      REFERENCES "quizzes"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "intentos_quiz" ADD CONSTRAINT "FK_intentos_quiz_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "intentos_quiz"`);
    await queryRunner.query(`DROP TABLE "preguntas_quiz"`);
    await queryRunner.query(`DROP TABLE "quizzes"`);
  }
}
