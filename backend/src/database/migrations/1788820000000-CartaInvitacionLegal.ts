import { MigrationInterface, QueryRunner } from 'typeorm';

export class CartaInvitacionLegal1788820000000 implements MigrationInterface {
  name = 'CartaInvitacionLegal1788820000000';

  // Agrega un valor al enum nativo ya usado por documentos_legales.tipo. Mismo patrón que
  // 1788318326845-DisponibilidadYSolicitudesSesion.ts para notificaciones_tipo_enum.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."documentos_legales_tipo_enum" ADD VALUE 'carta_invitacion'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir un ALTER TYPE ... ADD VALUE no tiene comando directo en Postgres — se recrea
    // el tipo sin el valor nuevo. Falla si ya existe alguna fila con ese valor (mismo tipo de
    // pérdida esperable que un DROP TABLE en cualquier otro down()).
    await queryRunner.query(
      `ALTER TYPE "public"."documentos_legales_tipo_enum" RENAME TO "documentos_legales_tipo_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documentos_legales_tipo_enum" AS ENUM('contrato', 'nda')`,
    );
    await queryRunner.query(`
      ALTER TABLE "documentos_legales" ALTER COLUMN "tipo" TYPE "public"."documentos_legales_tipo_enum"
      USING "tipo"::text::"public"."documentos_legales_tipo_enum"
    `);
    await queryRunner.query(
      `DROP TYPE "public"."documentos_legales_tipo_enum_old"`,
    );
  }
}
