import { MigrationInterface, QueryRunner } from 'typeorm';

export class EncuestaSatisfaccionPorCiclo1788631591123 implements MigrationInterface {
  name = 'EncuestaSatisfaccionPorCiclo1788631591123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "encuestas_satisfaccion"
      ADD COLUMN "ciclo_id" uuid,
      ADD COLUMN "respuestas" jsonb,
      ADD CONSTRAINT "UQ_encuestas_satisfaccion_ciclo_id" UNIQUE ("ciclo_id"),
      ADD CONSTRAINT "FK_encuestas_satisfaccion_ciclo_id"
        FOREIGN KEY ("ciclo_id") REFERENCES "ciclos_coaching"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "encuestas_satisfaccion"
      DROP CONSTRAINT "FK_encuestas_satisfaccion_ciclo_id",
      DROP CONSTRAINT "UQ_encuestas_satisfaccion_ciclo_id",
      DROP COLUMN "respuestas",
      DROP COLUMN "ciclo_id"
    `);
  }
}
