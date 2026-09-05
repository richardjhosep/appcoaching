import { MigrationInterface, QueryRunner } from 'typeorm';

export class FechaLimiteContenido1788356642011 implements MigrationInterface {
  name = 'FechaLimiteContenido1788356642011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD COLUMN "fecha_limite" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "flashcards" ADD COLUMN "fecha_limite" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "mapas_mentales" ADD COLUMN "fecha_limite" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicios" ADD COLUMN "fecha_limite" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests_estilo" ADD COLUMN "fecha_limite" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "recursos" ADD COLUMN "fecha_limite" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recursos" DROP COLUMN "fecha_limite"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tests_estilo" DROP COLUMN "fecha_limite"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ejercicios" DROP COLUMN "fecha_limite"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mapas_mentales" DROP COLUMN "fecha_limite"`,
    );
    await queryRunner.query(
      `ALTER TABLE "flashcards" DROP COLUMN "fecha_limite"`,
    );
    await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "fecha_limite"`);
  }
}
