import { MigrationInterface, QueryRunner } from 'typeorm';

export class CarpetasYAccesoConVencimiento1785871843864 implements MigrationInterface {
  name = 'CarpetasYAccesoConVencimiento1785871843864';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "carpetas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying NOT NULL,
        "parent_id" uuid,
        "publica" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_carpetas" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "carpetas"
      ADD CONSTRAINT "FK_carpetas_parent" FOREIGN KEY ("parent_id")
      REFERENCES "carpetas"("id") ON DELETE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE "asignaciones_carpeta" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "carpeta_id" uuid NOT NULL,
        "coachee_id" uuid NOT NULL,
        "activa" boolean NOT NULL DEFAULT true,
        "expira_en" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_asignaciones_carpeta" UNIQUE ("carpeta_id", "coachee_id"),
        CONSTRAINT "PK_asignaciones_carpeta" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "asignaciones_carpeta"
      ADD CONSTRAINT "FK_ac_carpeta" FOREIGN KEY ("carpeta_id")
      REFERENCES "carpetas"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "asignaciones_carpeta"
      ADD CONSTRAINT "FK_ac_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);

    // --- recursos: etiquetas -> carpeta_id ---------------------------------
    await queryRunner.query(`ALTER TABLE "recursos" ADD "carpeta_id" uuid`);

    // Una carpeta raíz por cada primer tag distinto (mismo criterio que ya
    // usaba el frontend: primera etiqueta = "tópico"); sin etiqueta -> "Sin categoría".
    await queryRunner.query(`
      INSERT INTO "carpetas" (nombre)
      SELECT DISTINCT COALESCE(NULLIF(TRIM(split_part(etiquetas, ',', 1)), ''), 'Sin categoría')
      FROM "recursos"
    `);
    await queryRunner.query(`
      UPDATE "recursos" r
      SET carpeta_id = c.id
      FROM "carpetas" c
      WHERE c.nombre = COALESCE(NULLIF(TRIM(split_part(r.etiquetas, ',', 1)), ''), 'Sin categoría')
    `);

    await queryRunner.query(
      `ALTER TABLE "recursos" ALTER COLUMN "carpeta_id" SET NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "recursos"
      ADD CONSTRAINT "FK_recursos_carpeta" FOREIGN KEY ("carpeta_id")
      REFERENCES "carpetas"("id")
    `);
    await queryRunner.query(`ALTER TABLE "recursos" DROP COLUMN "etiquetas"`);

    // --- asignaciones_recurso: origen -> expira_en -------------------------
    await queryRunner.query(
      `ALTER TABLE "asignaciones_recurso" ADD "expira_en" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "asignaciones_recurso" DROP COLUMN "origen"`,
    );
    await queryRunner.query(`DROP TYPE "asignaciones_recurso_origen_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "asignaciones_recurso_origen_enum" AS ENUM('coach', 'autoasignado')`,
    );
    await queryRunner.query(`
      ALTER TABLE "asignaciones_recurso"
      ADD "origen" "asignaciones_recurso_origen_enum" NOT NULL DEFAULT 'coach'
    `);
    await queryRunner.query(
      `ALTER TABLE "asignaciones_recurso" DROP COLUMN "expira_en"`,
    );

    // Best-effort: cada recurso recupera como única etiqueta el nombre de la
    // carpeta en la que quedó (se pierde cualquier segunda/tercera etiqueta
    // original, que nunca se guardó por separado tras la migración de ida).
    await queryRunner.query(`ALTER TABLE "recursos" ADD "etiquetas" text`);
    await queryRunner.query(`
      UPDATE "recursos" r
      SET etiquetas = c.nombre
      FROM "carpetas" c
      WHERE c.id = r.carpeta_id
    `);
    await queryRunner.query(
      `ALTER TABLE "recursos" DROP CONSTRAINT "FK_recursos_carpeta"`,
    );
    await queryRunner.query(`ALTER TABLE "recursos" DROP COLUMN "carpeta_id"`);

    await queryRunner.query(`DROP TABLE "asignaciones_carpeta"`);
    await queryRunner.query(`DROP TABLE "carpetas"`);
  }
}
