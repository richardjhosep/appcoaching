import { MigrationInterface, QueryRunner } from 'typeorm';

// Documentos del proceso de un coachee (CV, evaluación de desempeño, descriptor de cargo u
// otro) compartidos entre coach, coachee y empresa — feedback del coach, 10-10-2026.
export class DocumentosCoachee1788900000000 implements MigrationInterface {
  name = 'DocumentosCoachee1788900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."documentos_coachee_tipo_enum" AS ENUM('cv', 'evaluacion_desempeno', 'descriptor_cargo', 'otro')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."documentos_coachee_subido_por_rol_enum" AS ENUM('coach', 'coachee', 'empresa')`,
    );
    await queryRunner.query(`
      CREATE TABLE "documentos_coachee" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachee_id" uuid NOT NULL,
        "tipo" "public"."documentos_coachee_tipo_enum" NOT NULL,
        "descripcion" character varying,
        "archivo_path" character varying NOT NULL,
        "archivo_nombre" character varying NOT NULL,
        "subido_por_user_id" uuid NOT NULL,
        "subido_por_rol" "public"."documentos_coachee_subido_por_rol_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documentos_coachee" PRIMARY KEY ("id"),
        CONSTRAINT "FK_documentos_coachee_coachee" FOREIGN KEY ("coachee_id")
          REFERENCES "coachees"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_documentos_coachee_coachee" ON "documentos_coachee" ("coachee_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_documentos_coachee_coachee"`,
    );
    await queryRunner.query(`DROP TABLE "documentos_coachee"`);
    await queryRunner.query(
      `DROP TYPE "public"."documentos_coachee_subido_por_rol_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."documentos_coachee_tipo_enum"`,
    );
  }
}
