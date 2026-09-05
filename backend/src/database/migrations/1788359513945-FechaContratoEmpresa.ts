import { MigrationInterface, QueryRunner } from 'typeorm';

export class FechaContratoEmpresa1788359513945 implements MigrationInterface {
  name = 'FechaContratoEmpresa1788359513945';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "empresas" ADD COLUMN "fecha_inicio" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresas" ADD COLUMN "fecha_fin" date`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "empresas" DROP COLUMN "fecha_fin"`);
    await queryRunner.query(
      `ALTER TABLE "empresas" DROP COLUMN "fecha_inicio"`,
    );
  }
}
