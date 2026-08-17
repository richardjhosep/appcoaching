import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompetenciaEnRecurso1786989428463 implements MigrationInterface {
  name = 'CompetenciaEnRecurso1786989428463';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recursos" ADD COLUMN "competencia_id" uuid`,
    );
    await queryRunner.query(`
      ALTER TABLE "recursos" ADD CONSTRAINT "FK_recursos_competencia" FOREIGN KEY ("competencia_id")
      REFERENCES "competencias"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recursos" DROP CONSTRAINT "FK_recursos_competencia"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recursos" DROP COLUMN "competencia_id"`,
    );
  }
}
