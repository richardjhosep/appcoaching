import { MigrationInterface, QueryRunner } from 'typeorm';

// Posición/cargo del coachee dentro de su empresa (feedback del coach, 10-10-2026) —
// distinto de `area_gerencia` (a qué área pertenece) y de `jefe_directo`.
export class CargoCoachee1788870000000 implements MigrationInterface {
  name = 'CargoCoachee1788870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coachees" ADD "cargo" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "coachees" DROP COLUMN "cargo"`);
  }
}
