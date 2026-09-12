import { MigrationInterface, QueryRunner } from 'typeorm';

export class TarifaEnUf1788810000000 implements MigrationInterface {
  name = 'TarifaEnUf1788810000000';

  // `tarifa_hora`/`tarifa_propia` pasan de `integer` a `numeric(12,2)` — en UF el monto
  // es fraccionario (ej. 3.5 UF/hora). Un `integer` cabe exacto dentro de un `numeric`,
  // así que el cast es sin pérdida para los contratos ya existentes (todos en CLP).
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "empresas_tarifa_hora_moneda_enum" AS ENUM ('clp', 'uf')
    `);
    await queryRunner.query(`
      ALTER TABLE "empresas" ALTER COLUMN "tarifa_hora" TYPE numeric(12,2)
    `);
    await queryRunner.query(`
      ALTER TABLE "empresas" ADD "tarifa_hora_moneda" "empresas_tarifa_hora_moneda_enum"
      NOT NULL DEFAULT 'clp'
    `);

    await queryRunner.query(`
      CREATE TYPE "coachees_tarifa_propia_moneda_enum" AS ENUM ('clp', 'uf')
    `);
    await queryRunner.query(`
      ALTER TABLE "coachees" ALTER COLUMN "tarifa_propia" TYPE numeric(12,2)
    `);
    await queryRunner.query(`
      ALTER TABLE "coachees" ADD "tarifa_propia_moneda" "coachees_tarifa_propia_moneda_enum"
      NOT NULL DEFAULT 'clp'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coachees" DROP COLUMN "tarifa_propia_moneda"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" ALTER COLUMN "tarifa_propia" TYPE integer USING round("tarifa_propia")::integer`,
    );
    await queryRunner.query(`DROP TYPE "coachees_tarifa_propia_moneda_enum"`);

    await queryRunner.query(
      `ALTER TABLE "empresas" DROP COLUMN "tarifa_hora_moneda"`,
    );
    await queryRunner.query(
      `ALTER TABLE "empresas" ALTER COLUMN "tarifa_hora" TYPE integer USING round("tarifa_hora")::integer`,
    );
    await queryRunner.query(`DROP TYPE "empresas_tarifa_hora_moneda_enum"`);
  }
}
