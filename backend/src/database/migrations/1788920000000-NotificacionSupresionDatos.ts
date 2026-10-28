import { MigrationInterface, QueryRunner } from 'typeorm';

// Ley 21.719: el coachee puede pedir la supresión de sus datos y el coach recibe un aviso en
// la campana. Es un valor nuevo del enum de tipos de notificación.
export class NotificacionSupresionDatos1788920000000 implements MigrationInterface {
  name = 'NotificacionSupresionDatos1788920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "notificaciones_tipo_enum" ADD VALUE IF NOT EXISTS 'supresion_solicitada'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres no permite quitar un valor de un enum; el valor sobrante es inofensivo.
  }
}
