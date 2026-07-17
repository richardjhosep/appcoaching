import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlanDesarrollo1784229067806 implements MigrationInterface {
  name = 'AddPlanDesarrollo1784229067806';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "competencias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying NOT NULL, "definicion" text NOT NULL, "niveles" jsonb NOT NULL, CONSTRAINT "UQ_27c66a70b11a5f0db83b7e5373d" UNIQUE ("nombre"), CONSTRAINT "PK_5200c17b2042a1db2e495f3af37" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."planes_desarrollo_estado_enum" AS ENUM('sin_enviar', 'pendiente_aprobacion', 'aprobado', 'cambios_solicitados')`,
    );
    await queryRunner.query(
      `CREATE TABLE "planes_desarrollo" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coachee_id" uuid NOT NULL, "competencia_id" uuid, "nivel_actual" integer, "nivel_objetivo" integer, "plazo" character varying, "descripcion_estado_actual" text, "objetivo_general" text, "estado" "public"."planes_desarrollo_estado_enum" NOT NULL DEFAULT 'sin_enviar', "comentario_coach" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c69c4db821a73dd4f298307461b" UNIQUE ("coachee_id"), CONSTRAINT "REL_c69c4db821a73dd4f298307461" UNIQUE ("coachee_id"), CONSTRAINT "PK_b29a02704cc57b1c4c29c1cbb1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "objetivos_especificos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_id" uuid NOT NULL, "descripcion" text NOT NULL, "orden" integer NOT NULL DEFAULT '1', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_172d580796efec2ef2598a75ba5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD CONSTRAINT "FK_c69c4db821a73dd4f298307461b" FOREIGN KEY ("coachee_id") REFERENCES "coachees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD CONSTRAINT "FK_8687c262669fe8ac96b3980cc19" FOREIGN KEY ("competencia_id") REFERENCES "competencias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "objetivos_especificos" ADD CONSTRAINT "FK_d1aa132cf7f2706b9ed5f681486" FOREIGN KEY ("plan_id") REFERENCES "planes_desarrollo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "objetivos_especificos" DROP CONSTRAINT "FK_d1aa132cf7f2706b9ed5f681486"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP CONSTRAINT "FK_8687c262669fe8ac96b3980cc19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP CONSTRAINT "FK_c69c4db821a73dd4f298307461b"`,
    );
    await queryRunner.query(`DROP TABLE "objetivos_especificos"`);
    await queryRunner.query(`DROP TABLE "planes_desarrollo"`);
    await queryRunner.query(
      `DROP TYPE "public"."planes_desarrollo_estado_enum"`,
    );
    await queryRunner.query(`DROP TABLE "competencias"`);
  }
}
