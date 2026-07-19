import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLegalYAuditoria1784339294252 implements MigrationInterface {
  name = 'AddLegalYAuditoria1784339294252';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."documentos_legales_tipo_enum" AS ENUM('contrato', 'nda')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documentos_legales_estado_enum" AS ENUM('firmado', 'pendiente')`,
    );
    await queryRunner.query(
      `CREATE TABLE "documentos_legales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "empresa_id" uuid NOT NULL, "tipo" "public"."documentos_legales_tipo_enum" NOT NULL, "estado" "public"."documentos_legales_estado_enum" NOT NULL DEFAULT 'pendiente', "fecha" date, "vigencia" date, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e663e43c5541c561d82900e816b" UNIQUE ("empresa_id", "tipo"), CONSTRAINT "PK_d73629830cdbc720ecacd1d20fd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" ADD "consentimiento_informado" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" ADD "consentimiento_fecha" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "documentos_legales" ADD CONSTRAINT "FK_035769eadc7c52a15be3a0ae1db" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "documentos_legales" DROP CONSTRAINT "FK_035769eadc7c52a15be3a0ae1db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" DROP COLUMN "consentimiento_fecha"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" DROP COLUMN "consentimiento_informado"`,
    );
    await queryRunner.query(`DROP TABLE "documentos_legales"`);
    await queryRunner.query(
      `DROP TYPE "public"."documentos_legales_estado_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."documentos_legales_tipo_enum"`,
    );
  }
}
