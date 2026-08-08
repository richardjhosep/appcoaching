import { MigrationInterface, QueryRunner } from 'typeorm';

export class SolicitudesConsentimiento1786020180000 implements MigrationInterface {
  name = 'SolicitudesConsentimiento1786020180000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "solicitudes_consentimiento_estado_enum" AS ENUM('pendiente', 'aceptado', 'rechazado')`,
    );
    await queryRunner.query(`
      CREATE TABLE "solicitudes_consentimiento" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachee_id" uuid NOT NULL,
        "token" character varying NOT NULL,
        "estado" "solicitudes_consentimiento_estado_enum" NOT NULL DEFAULT 'pendiente',
        "expira_en" TIMESTAMP WITH TIME ZONE NOT NULL,
        "respondido_en" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_solicitudes_consentimiento_token" UNIQUE ("token"),
        CONSTRAINT "PK_solicitudes_consentimiento" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "solicitudes_consentimiento"
      ADD CONSTRAINT "FK_solicitudes_consentimiento_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "solicitudes_consentimiento"`);
    await queryRunner.query(
      `DROP TYPE "solicitudes_consentimiento_estado_enum"`,
    );
  }
}
