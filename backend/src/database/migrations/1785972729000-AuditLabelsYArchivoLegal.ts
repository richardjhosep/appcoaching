import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditLabelsYArchivoLegal1785972729000 implements MigrationInterface {
  name = 'AuditLabelsYArchivoLegal1785972729000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "actor_label" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "target_label" character varying`,
    );

    await queryRunner.query(
      `ALTER TABLE "documentos_legales" ADD "archivo_path" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_legales" ADD "archivo_nombre" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documentos_legales" DROP COLUMN "archivo_nombre"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_legales" DROP COLUMN "archivo_path"`,
    );

    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP COLUMN "target_label"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP COLUMN "actor_label"`,
    );
  }
}
