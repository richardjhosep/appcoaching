import { MigrationInterface, QueryRunner } from 'typeorm';

export class IndicadoresEconomicos1788800000000 implements MigrationInterface {
  name = 'IndicadoresEconomicos1788800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "indicadores_economicos" (
        "fecha" date NOT NULL,
        "valor_uf" numeric(12,2),
        "valor_usd" numeric(12,2),
        "fuente" character varying NOT NULL DEFAULT 'cmf',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_indicadores_economicos" PRIMARY KEY ("fecha")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "indicadores_economicos"`);
  }
}
