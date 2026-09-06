import { MigrationInterface, QueryRunner } from 'typeorm';

export class Prospectos1788730000000 implements MigrationInterface {
  name = 'Prospectos1788730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "prospectos_tipo_enum" AS ENUM('persona', 'empresa')`,
    );
    await queryRunner.query(
      `CREATE TYPE "prospectos_etapa_enum" AS ENUM('contactado', 'propuesta_enviada', 'negociacion', 'ganado', 'perdido')`,
    );
    await queryRunner.query(`
      CREATE TABLE "prospectos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying NOT NULL,
        "tipo" "prospectos_tipo_enum" NOT NULL,
        "contacto_nombre" character varying,
        "email" character varying,
        "telefono" character varying,
        "fuente" character varying,
        "valor_estimado" integer,
        "etapa" "prospectos_etapa_enum" NOT NULL DEFAULT 'contactado',
        "notas" text,
        "convertido_empresa_id" uuid,
        "convertido_coachee_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_prospectos" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "gestiones_prospecto" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "prospecto_id" uuid NOT NULL,
        "nota" text NOT NULL,
        "proximo_seguimiento" date,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gestiones_prospecto" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "gestiones_prospecto"
      ADD CONSTRAINT "FK_gestiones_prospecto_prospecto" FOREIGN KEY ("prospecto_id")
      REFERENCES "prospectos"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "gestiones_prospecto"`);
    await queryRunner.query(`DROP TABLE "prospectos"`);
    await queryRunner.query(`DROP TYPE "prospectos_etapa_enum"`);
    await queryRunner.query(`DROP TYPE "prospectos_tipo_enum"`);
  }
}
