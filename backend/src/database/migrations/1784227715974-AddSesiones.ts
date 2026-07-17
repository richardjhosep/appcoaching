import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSesiones1784227715974 implements MigrationInterface {
  name = 'AddSesiones1784227715974';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sesiones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coachee_id" uuid NOT NULL, "fecha_hora" TIMESTAMP WITH TIME ZONE NOT NULL, "link_videollamada" character varying, "resumen_compartido" text, "notas_privadas" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4237ef09f1dc217c1660f23253" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."solicitudes_reagendamiento_estado_enum" AS ENUM('pendiente', 'resuelta')`,
    );
    await queryRunner.query(
      `CREATE TABLE "solicitudes_reagendamiento" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sesion_id" uuid NOT NULL, "coachee_id" uuid NOT NULL, "motivo" text, "estado" "public"."solicitudes_reagendamiento_estado_enum" NOT NULL DEFAULT 'pendiente', "respuesta_coach" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "resolved_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_2b5e270625aa9135a0223d74ae5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones" ADD CONSTRAINT "FK_608dc3355b3aba712bfac28c5fe" FOREIGN KEY ("coachee_id") REFERENCES "coachees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes_reagendamiento" ADD CONSTRAINT "FK_dae8c50a7d3ae24cdd435a2f2f2" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitudes_reagendamiento" DROP CONSTRAINT "FK_dae8c50a7d3ae24cdd435a2f2f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones" DROP CONSTRAINT "FK_608dc3355b3aba712bfac28c5fe"`,
    );
    await queryRunner.query(`DROP TABLE "solicitudes_reagendamiento"`);
    await queryRunner.query(
      `DROP TYPE "public"."solicitudes_reagendamiento_estado_enum"`,
    );
    await queryRunner.query(`DROP TABLE "sesiones"`);
  }
}
