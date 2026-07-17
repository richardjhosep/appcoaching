import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCiclosCoaching1784246836696 implements MigrationInterface {
  name = 'AddCiclosCoaching1784246836696';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ciclos_coaching_resultado_enum" AS ENUM('logrado', 'medianamente_logrado', 'no_logrado')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ciclos_coaching" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coachee_id" uuid NOT NULL, "total_sesiones" integer NOT NULL, "fecha_apertura" TIMESTAMP WITH TIME ZONE NOT NULL, "fecha_cierre" TIMESTAMP WITH TIME ZONE, "resultado" "public"."ciclos_coaching_resultado_enum", "resumen_reunion_inicial" text, "informe_final" text, "informe_pdf_nombre" character varying, "informe_pdf_path" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4109789aa2bb771d2498551a692" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "sesiones" ADD "ciclo_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "ciclos_coaching" ADD CONSTRAINT "FK_ec907524c71fd12f236ef76920d" FOREIGN KEY ("coachee_id") REFERENCES "coachees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones" ADD CONSTRAINT "FK_443243c9b6dc1dba76794f8d691" FOREIGN KEY ("ciclo_id") REFERENCES "ciclos_coaching"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sesiones" DROP CONSTRAINT "FK_443243c9b6dc1dba76794f8d691"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ciclos_coaching" DROP CONSTRAINT "FK_ec907524c71fd12f236ef76920d"`,
    );
    await queryRunner.query(`ALTER TABLE "sesiones" DROP COLUMN "ciclo_id"`);
    await queryRunner.query(`DROP TABLE "ciclos_coaching"`);
    await queryRunner.query(
      `DROP TYPE "public"."ciclos_coaching_resultado_enum"`,
    );
  }
}
