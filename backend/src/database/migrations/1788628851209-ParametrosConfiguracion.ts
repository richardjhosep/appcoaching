import { MigrationInterface, QueryRunner } from 'typeorm';

export class ParametrosConfiguracion1788628851209 implements MigrationInterface {
  name = 'ParametrosConfiguracion1788628851209';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "parametros_configuracion" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "grupo" character varying NOT NULL,
        "clave" character varying NOT NULL,
        "valor" text NOT NULL,
        "estado" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_parametros_configuracion" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_parametros_configuracion_grupo_clave"
      ON "parametros_configuracion" ("grupo", "clave")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "parametros_configuracion"`);
  }
}
