import { MigrationInterface, QueryRunner } from 'typeorm';

export class AmpliarLegalIndependientesYAdicionales1785975197000 implements MigrationInterface {
  name = 'AmpliarLegalIndependientesYAdicionales1785975197000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- documentos_legales: contrato/NDA también puede apuntar a un coachee
    // independiente en vez de a una empresa (exactamente uno de los dos) -----
    await queryRunner.query(
      `ALTER TABLE "documentos_legales" ALTER COLUMN "empresa_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_legales" ADD "coachee_id" uuid`,
    );
    await queryRunner.query(`
      ALTER TABLE "documentos_legales"
      ADD CONSTRAINT "FK_documentos_legales_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "documentos_legales"
      ADD CONSTRAINT "UQ_documentos_legales_coachee_tipo" UNIQUE ("coachee_id", "tipo")
    `);
    await queryRunner.query(`
      ALTER TABLE "documentos_legales"
      ADD CONSTRAINT "CHK_documentos_legales_target"
      CHECK (("empresa_id" IS NOT NULL) <> ("coachee_id" IS NOT NULL))
    `);

    // --- documentos_adicionales_legales: archivos sueltos (correos, addendums,
    // evidencia) con título libre, por empresa o por coachee ------------------
    await queryRunner.query(`
      CREATE TABLE "documentos_adicionales_legales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid,
        "coachee_id" uuid,
        "titulo" character varying NOT NULL,
        "archivo_path" character varying NOT NULL,
        "archivo_nombre" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_documentos_adicionales_target"
          CHECK (("empresa_id" IS NOT NULL) <> ("coachee_id" IS NOT NULL)),
        CONSTRAINT "PK_documentos_adicionales_legales" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "documentos_adicionales_legales"
      ADD CONSTRAINT "FK_dal_empresa" FOREIGN KEY ("empresa_id")
      REFERENCES "empresas"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "documentos_adicionales_legales"
      ADD CONSTRAINT "FK_dal_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "documentos_adicionales_legales"`);

    await queryRunner.query(
      `ALTER TABLE "documentos_legales" DROP CONSTRAINT "CHK_documentos_legales_target"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_legales" DROP CONSTRAINT "UQ_documentos_legales_coachee_tipo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_legales" DROP CONSTRAINT "FK_documentos_legales_coachee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_legales" DROP COLUMN "coachee_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_legales" ALTER COLUMN "empresa_id" SET NOT NULL`,
    );
  }
}
