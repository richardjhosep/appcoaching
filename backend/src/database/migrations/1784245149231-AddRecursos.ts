import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecursos1784245149231 implements MigrationInterface {
  name = 'AddRecursos1784245149231';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."recursos_tipo_enum" AS ENUM('archivo', 'link')`,
    );
    await queryRunner.query(
      `CREATE TABLE "recursos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "titulo" character varying NOT NULL, "descripcion" text, "etiquetas" text, "tipo" "public"."recursos_tipo_enum" NOT NULL, "url" character varying, "archivo_nombre" character varying, "archivo_path" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a0d9a8e3adc0a5c2961159930a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "aprendizajes_recurso" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "recurso_id" uuid NOT NULL, "coachee_id" uuid NOT NULL, "contenido" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fe775b4e3504d045d531e5a4068" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."asignaciones_recurso_origen_enum" AS ENUM('coach', 'autoasignado')`,
    );
    await queryRunner.query(
      `CREATE TABLE "asignaciones_recurso" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "recurso_id" uuid NOT NULL, "coachee_id" uuid NOT NULL, "activa" boolean NOT NULL DEFAULT true, "origen" "public"."asignaciones_recurso_origen_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f38e9e68e5cb0437c584bccb4d6" UNIQUE ("recurso_id", "coachee_id"), CONSTRAINT "PK_17a04623da86a278a71d6f5303d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "aprendizajes_recurso" ADD CONSTRAINT "FK_d93acfaab190a56882ac4841d02" FOREIGN KEY ("recurso_id") REFERENCES "recursos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "aprendizajes_recurso" ADD CONSTRAINT "FK_d1d1d67dbbcf708a7ad4ca217d3" FOREIGN KEY ("coachee_id") REFERENCES "coachees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asignaciones_recurso" ADD CONSTRAINT "FK_4263596a5f95a7d8d999ab519a2" FOREIGN KEY ("recurso_id") REFERENCES "recursos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asignaciones_recurso" ADD CONSTRAINT "FK_a52c555cf8757bc8cb23ab190f9" FOREIGN KEY ("coachee_id") REFERENCES "coachees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "asignaciones_recurso" DROP CONSTRAINT "FK_a52c555cf8757bc8cb23ab190f9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asignaciones_recurso" DROP CONSTRAINT "FK_4263596a5f95a7d8d999ab519a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "aprendizajes_recurso" DROP CONSTRAINT "FK_d1d1d67dbbcf708a7ad4ca217d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "aprendizajes_recurso" DROP CONSTRAINT "FK_d93acfaab190a56882ac4841d02"`,
    );
    await queryRunner.query(`DROP TABLE "asignaciones_recurso"`);
    await queryRunner.query(
      `DROP TYPE "public"."asignaciones_recurso_origen_enum"`,
    );
    await queryRunner.query(`DROP TABLE "aprendizajes_recurso"`);
    await queryRunner.query(`DROP TABLE "recursos"`);
    await queryRunner.query(`DROP TYPE "public"."recursos_tipo_enum"`);
  }
}
