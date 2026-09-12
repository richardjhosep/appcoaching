import { MigrationInterface, QueryRunner } from 'typeorm';

export class FechasActividadEjecucionReales1788770000000 implements MigrationInterface {
  name = 'FechasActividadEjecucionReales1788770000000';

  // `fecha_inicio`/`fecha_fin` de actividades_ejecucion eran texto libre ("Semana 1",
  // o cualquier otra cosa que el coachee escribiera) — pasan a ser fechas calendario
  // reales, mismo criterio que Empresa.fecha_inicio/fecha_fin (`date`, no `timestamptz`).
  // El USING con guarda de regex es necesario porque el valor previo podía ser
  // literalmente cualquier string; lo que no calce con una fecha ISO se pierde (pasa a
  // NULL) en vez de romper la migración.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "actividades_ejecucion"
      ALTER COLUMN "fecha_inicio" TYPE date
      USING (CASE WHEN "fecha_inicio" ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN "fecha_inicio"::date ELSE NULL END)
    `);
    await queryRunner.query(`
      ALTER TABLE "actividades_ejecucion"
      ALTER COLUMN "fecha_fin" TYPE date
      USING (CASE WHEN "fecha_fin" ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN "fecha_fin"::date ELSE NULL END)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "actividades_ejecucion"
      ALTER COLUMN "fecha_inicio" TYPE character varying
      USING "fecha_inicio"::character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "actividades_ejecucion"
      ALTER COLUMN "fecha_fin" TYPE character varying
      USING "fecha_fin"::character varying
    `);
  }
}
