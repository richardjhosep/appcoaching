import { MigrationInterface, QueryRunner } from 'typeorm';

// Feedback del coach (10-10-2026): el nivel actual/objetivo de la competencia es subjetivo —
// pasa a ser opcional por plan, decidido por el coach. Planes nuevos arrancan sin niveles;
// los existentes que ya tenían algún nivel cargado los conservan activados para no esconder
// datos que el coachee ya ingresó.
export class PlanTrabajarNiveles1788890000000 implements MigrationInterface {
  name = 'PlanTrabajarNiveles1788890000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "trabajar_niveles" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "planes_desarrollo" SET "trabajar_niveles" = true WHERE "nivel_actual" IS NOT NULL OR "nivel_objetivo" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "trabajar_niveles"`,
    );
  }
}
