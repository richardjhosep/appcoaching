import { MigrationInterface, QueryRunner } from 'typeorm';

export class DisponibilidadYSolicitudesSesion1788318326845 implements MigrationInterface {
  name = 'DisponibilidadYSolicitudesSesion1788318326845';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "disponibilidad_coach" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "dia_semana" integer NOT NULL,
        "hora_inicio" character varying(5) NOT NULL,
        "hora_fin" character varying(5) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_disponibilidad_coach" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."solicitudes_sesion_estado_enum" AS ENUM('pendiente', 'aprobada', 'rechazada')`,
    );
    await queryRunner.query(`
      CREATE TABLE "solicitudes_sesion" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachee_id" uuid NOT NULL,
        "fecha_hora_propuesta" TIMESTAMP WITH TIME ZONE NOT NULL,
        "motivo" text,
        "estado" "public"."solicitudes_sesion_estado_enum" NOT NULL DEFAULT 'pendiente',
        "respuesta_coach" text,
        "sesion_creada_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_solicitudes_sesion" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "solicitudes_sesion" ADD CONSTRAINT "FK_solicitudes_sesion_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "solicitudes_sesion" ADD CONSTRAINT "FK_solicitudes_sesion_sesion_creada" FOREIGN KEY ("sesion_creada_id")
      REFERENCES "sesiones"("id") ON DELETE SET NULL
    `);
    // Índice único parcial: cierra a nivel de base de datos la carrera de dos coachees
    // pidiendo el mismo horario casi al mismo tiempo (la re-validación en el servicio evita
    // la mayoría de los casos, esto es la garantía dura). Solo aplica mientras la solicitud
    // sigue pendiente — una vez resuelta, ese horario puede volver a pedirse si vuelve a
    // quedar libre.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_solicitudes_sesion_pendiente_horario" ON "solicitudes_sesion" ("fecha_hora_propuesta")
      WHERE "estado" = 'pendiente'
    `);

    // Agrega los 2 valores nuevos al enum nativo ya usado por "notificaciones"."tipo". No se
    // puede usar el valor recién agregado dentro de la misma transacción de creación en
    // versiones viejas de Postgres, pero acá no se inserta nada — solo se amplía el tipo.
    await queryRunner.query(
      `ALTER TYPE "public"."notificaciones_tipo_enum" ADD VALUE 'solicitud_sesion_creada'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."notificaciones_tipo_enum" ADD VALUE 'solicitud_sesion_resuelta'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir un ALTER TYPE ... ADD VALUE no tiene comando directo en Postgres — se recrea
    // el tipo sin los valores nuevos. Esto falla si ya existe alguna fila con esos valores
    // (mismo tipo de pérdida esperable que un DROP TABLE en cualquier otro down()).
    await queryRunner.query(
      `ALTER TYPE "public"."notificaciones_tipo_enum" RENAME TO "notificaciones_tipo_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notificaciones_tipo_enum" AS ENUM('reagendamiento_solicitado', 'reagendamiento_resuelto')`,
    );
    await queryRunner.query(`
      ALTER TABLE "notificaciones" ALTER COLUMN "tipo" TYPE "public"."notificaciones_tipo_enum"
      USING "tipo"::text::"public"."notificaciones_tipo_enum"
    `);
    await queryRunner.query(
      `DROP TYPE "public"."notificaciones_tipo_enum_old"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."UQ_solicitudes_sesion_pendiente_horario"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes_sesion" DROP CONSTRAINT "FK_solicitudes_sesion_sesion_creada"`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes_sesion" DROP CONSTRAINT "FK_solicitudes_sesion_coachee"`,
    );
    await queryRunner.query(`DROP TABLE "solicitudes_sesion"`);
    await queryRunner.query(
      `DROP TYPE "public"."solicitudes_sesion_estado_enum"`,
    );
    await queryRunner.query(`DROP TABLE "disponibilidad_coach"`);
  }
}
