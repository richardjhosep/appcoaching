import { MigrationInterface, QueryRunner } from 'typeorm';

export class Flashcards1786934534972 implements MigrationInterface {
  name = 'Flashcards1786934534972';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "flashcards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "anverso" text NOT NULL,
        "reverso" text NOT NULL,
        "competencia_id" uuid NOT NULL,
        "recurso_id" uuid,
        "activo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_flashcards" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "repasos_flashcard" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "flashcard_id" uuid NOT NULL,
        "coachee_id" uuid NOT NULL,
        "resultado" character varying NOT NULL,
        "proxima_revision" date NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_repasos_flashcard" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "flashcards" ADD CONSTRAINT "FK_flashcards_competencia" FOREIGN KEY ("competencia_id")
      REFERENCES "competencias"("id") ON DELETE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "flashcards" ADD CONSTRAINT "FK_flashcards_recurso" FOREIGN KEY ("recurso_id")
      REFERENCES "recursos"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "repasos_flashcard" ADD CONSTRAINT "FK_repasos_flashcard_flashcard" FOREIGN KEY ("flashcard_id")
      REFERENCES "flashcards"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "repasos_flashcard" ADD CONSTRAINT "FK_repasos_flashcard_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "repasos_flashcard"`);
    await queryRunner.query(`DROP TABLE "flashcards"`);
  }
}
