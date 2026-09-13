import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecurrenciaSesiones1788840000000 implements MigrationInterface {
  name = 'RecurrenciaSesiones1788840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sesiones" ADD "recurrencia_id" uuid
    `);
    // Acelera "traer las futuras de esta serie" (reagendar/cancelar "esta y las
    // siguientes") — se filtra siempre por recurrencia_id + fecha_hora futura.
    await queryRunner.query(`
      CREATE INDEX "IDX_sesiones_recurrencia_id" ON "sesiones" ("recurrencia_id")
      WHERE "recurrencia_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_sesiones_recurrencia_id"`);
    await queryRunner.query(
      `ALTER TABLE "sesiones" DROP COLUMN "recurrencia_id"`,
    );
  }
}
