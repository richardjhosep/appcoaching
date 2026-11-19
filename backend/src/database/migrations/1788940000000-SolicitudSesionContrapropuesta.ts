import { MigrationInterface, QueryRunner } from 'typeorm';

export class SolicitudSesionContrapropuesta1788940000000 implements MigrationInterface {
  name = 'SolicitudSesionContrapropuesta1788940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "solicitudes_sesion_estado_enum" ADD VALUE IF NOT EXISTS 'contrapropuesta'`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes_sesion" ADD COLUMN "fecha_hora_contrapropuesta" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes_sesion" ADD COLUMN "link_videollamada" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitudes_sesion" DROP COLUMN "link_videollamada"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes_sesion" DROP COLUMN "fecha_hora_contrapropuesta"`,
    );
    // Los valores de un enum de Postgres no se pueden quitar: 'contrapropuesta' queda en el tipo.
  }
}
