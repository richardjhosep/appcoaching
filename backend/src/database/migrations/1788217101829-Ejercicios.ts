import { MigrationInterface, QueryRunner } from 'typeorm';

export class Ejercicios1788217101829 implements MigrationInterface {
  name = 'Ejercicios1788217101829';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."versiones_ejercicio_estado_enum" AS ENUM('enviada', 'con_feedback')`,
    );
    await queryRunner.query(`
      CREATE TABLE "ejercicios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titulo" character varying NOT NULL,
        "consigna" text NOT NULL,
        "competencia_id" uuid,
        "activo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ejercicios" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "versiones_ejercicio" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "ejercicio_id" uuid NOT NULL,
        "coachee_id" uuid NOT NULL,
        "numero_version" integer NOT NULL,
        "sabe" text NOT NULL,
        "siente" text NOT NULL,
        "haga" text NOT NULL,
        "comentario_coach" text,
        "estado" "public"."versiones_ejercicio_estado_enum" NOT NULL DEFAULT 'enviada',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_versiones_ejercicio" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "ejercicios" ADD CONSTRAINT "FK_ejercicios_competencia" FOREIGN KEY ("competencia_id")
      REFERENCES "competencias"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "versiones_ejercicio" ADD CONSTRAINT "FK_versiones_ejercicio_ejercicio" FOREIGN KEY ("ejercicio_id")
      REFERENCES "ejercicios"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "versiones_ejercicio" ADD CONSTRAINT "FK_versiones_ejercicio_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "versiones_ejercicio"`);
    await queryRunner.query(`DROP TABLE "ejercicios"`);
    await queryRunner.query(
      `DROP TYPE "public"."versiones_ejercicio_estado_enum"`,
    );
  }
}
