import { MigrationInterface, QueryRunner } from 'typeorm';

export class GapsRapidosPlantillasReales1788215381070 implements MigrationInterface {
  name = 'GapsRapidosPlantillasReales1788215381070';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "aprendizajes_recurso" ADD COLUMN "aplicacion" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_ejecucion" ADD COLUMN "observaciones" text`,
    );
    await queryRunner.query(`ALTER TABLE "logros" ADD COLUMN "situacion" text`);
    await queryRunner.query(
      `ALTER TABLE "sesiones" ADD COLUMN "tema_tratado" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones" ADD COLUMN "ejercicios_aplicados" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones" ADD COLUMN "acuerdos" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sesiones" DROP COLUMN "acuerdos"`);
    await queryRunner.query(
      `ALTER TABLE "sesiones" DROP COLUMN "ejercicios_aplicados"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones" DROP COLUMN "tema_tratado"`,
    );
    await queryRunner.query(`ALTER TABLE "logros" DROP COLUMN "situacion"`);
    await queryRunner.query(
      `ALTER TABLE "actividades_ejecucion" DROP COLUMN "observaciones"`,
    );
    await queryRunner.query(
      `ALTER TABLE "aprendizajes_recurso" DROP COLUMN "aplicacion"`,
    );
  }
}
