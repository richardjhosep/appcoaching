import { MigrationInterface, QueryRunner } from 'typeorm';

// Feedback del coach (10-10-2026): las horas contratadas de una empresa pasan a calcularse
// (suma de las sesiones de los ciclos de sus coachees). `horas_fijas` marca el caso
// excepcional de un contrato con horas cerradas. Arranca en false para todas, como pidió el
// coach; el valor manual de `horas_contratadas` NO se borra — basta marcar la empresa como
// "horas fijas" para que vuelva a regir.
export class EmpresaHorasFijas1788910000000 implements MigrationInterface {
  name = 'EmpresaHorasFijas1788910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "empresas" ADD "horas_fijas" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "empresas" DROP COLUMN "horas_fijas"`);
  }
}
