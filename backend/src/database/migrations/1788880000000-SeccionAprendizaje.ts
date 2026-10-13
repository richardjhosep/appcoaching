import { MigrationInterface, QueryRunner } from 'typeorm';

// Capítulo(s)/sección estudiada en cada aprendizaje de la Biblioteca (feedback del coach,
// 10-10-2026). `aplicacion` sigue nullable en la base solo por los registros previos — la
// obligatoriedad nueva se valida en la API.
export class SeccionAprendizaje1788880000000 implements MigrationInterface {
  name = 'SeccionAprendizaje1788880000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "aprendizajes_recurso" ADD "seccion" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "aprendizajes_recurso" DROP COLUMN "seccion"`,
    );
  }
}
