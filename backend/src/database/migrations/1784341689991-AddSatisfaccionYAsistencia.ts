import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSatisfaccionYAsistencia1784341689991 implements MigrationInterface {
    name = 'AddSatisfaccionYAsistencia1784341689991'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "encuestas_satisfaccion" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "empresa_id" uuid NOT NULL, "calificacion" integer NOT NULL, "comentario" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_905939941df5eb39c319f6a557c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."solicitudes_proceso_estado_enum" AS ENUM('pendiente', 'atendida')`);
        await queryRunner.query(`CREATE TABLE "solicitudes_proceso" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "empresa_id" uuid NOT NULL, "nombre_sugerido" character varying NOT NULL, "mensaje" text, "estado" "public"."solicitudes_proceso_estado_enum" NOT NULL DEFAULT 'pendiente', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7fc7658545bdb66a7686e0c4304" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sesiones" ADD "asistio" boolean`);
        await queryRunner.query(`ALTER TABLE "encuestas_satisfaccion" ADD CONSTRAINT "FK_e00fe2a3bfd85c7d0bd99748689" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "solicitudes_proceso" ADD CONSTRAINT "FK_63d3c559c16d13e4431b5fb08aa" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "solicitudes_proceso" DROP CONSTRAINT "FK_63d3c559c16d13e4431b5fb08aa"`);
        await queryRunner.query(`ALTER TABLE "encuestas_satisfaccion" DROP CONSTRAINT "FK_e00fe2a3bfd85c7d0bd99748689"`);
        await queryRunner.query(`ALTER TABLE "sesiones" DROP COLUMN "asistio"`);
        await queryRunner.query(`DROP TABLE "solicitudes_proceso"`);
        await queryRunner.query(`DROP TYPE "public"."solicitudes_proceso_estado_enum"`);
        await queryRunner.query(`DROP TABLE "encuestas_satisfaccion"`);
    }

}
