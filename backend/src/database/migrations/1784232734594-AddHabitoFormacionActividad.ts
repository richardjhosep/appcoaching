import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHabitoFormacionActividad1784232734594 implements MigrationInterface {
  name = 'AddHabitoFormacionActividad1784232734594';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."actividades_ejecucion_estado_enum" AS ENUM('pendiente', 'en_curso', 'completada')`,
    );
    await queryRunner.query(
      `CREATE TABLE "actividades_ejecucion" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plan_id" uuid NOT NULL, "objetivo_id" uuid NOT NULL, "actividad" text NOT NULL, "fecha_inicio" character varying, "fecha_fin" character varying, "estado" "public"."actividades_ejecucion_estado_enum" NOT NULL DEFAULT 'pendiente', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1236c21e0cdc11a9bc7d62a03cf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "habito_cuando" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "habito_en_vez_de" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "habito_voy_a" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "habito_obvio" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "habito_sencillo" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "habito_atractivo" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "habito_satisfactorio" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "formacion_libros" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "formacion_articulos" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "formacion_videos" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "formacion_podcasts" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "formacion_practica_guiada" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_ejecucion" ADD CONSTRAINT "FK_1b0b91f04e92fdafc1ae4d5e12b" FOREIGN KEY ("plan_id") REFERENCES "planes_desarrollo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_ejecucion" ADD CONSTRAINT "FK_2a877f42a6033f9c0bd681f36ff" FOREIGN KEY ("objetivo_id") REFERENCES "objetivos_especificos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "actividades_ejecucion" DROP CONSTRAINT "FK_2a877f42a6033f9c0bd681f36ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_ejecucion" DROP CONSTRAINT "FK_1b0b91f04e92fdafc1ae4d5e12b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "formacion_practica_guiada"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "formacion_podcasts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "formacion_videos"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "formacion_articulos"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "formacion_libros"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "habito_satisfactorio"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "habito_atractivo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "habito_sencillo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "habito_obvio"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "habito_voy_a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "habito_en_vez_de"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "habito_cuando"`,
    );
    await queryRunner.query(`DROP TABLE "actividades_ejecucion"`);
    await queryRunner.query(
      `DROP TYPE "public"."actividades_ejecucion_estado_enum"`,
    );
  }
}
