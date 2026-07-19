import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNegocioFields1784314943348 implements MigrationInterface {
  name = 'AddNegocioFields1784314943348';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "empresas" ADD "pagada" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresas" ADD "horas_contratadas" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" ADD "area_gerencia" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coachees" DROP COLUMN "area_gerencia"`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresas" DROP COLUMN "horas_contratadas"`,
    );
    await queryRunner.query(`ALTER TABLE "empresas" DROP COLUMN "pagada"`);
  }
}
