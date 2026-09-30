import { MigrationInterface, QueryRunner } from 'typeorm';

// Permite que una empresa defina sus propias competencias (nombre + definición + niveles),
// separadas del catálogo global que hoy siembra/sobreescribe CompetenciasService en cada
// arranque. `empresa_id` NULL = competencia global (como hasta ahora); no nulo = propia de
// esa empresa.
//
// El nombre dejaba de poder ser único a secas: dos empresas distintas (o una empresa y el
// catálogo global) podrían llamar "Liderazgo" a cosas distintas. Se reemplaza el único
// UNIQUE(nombre) por dos índices únicos parciales: uno para el catálogo global (nombre único
// solo entre las filas sin empresa) y otro por empresa (nombre único dentro de cada empresa,
// pero libre de chocar con otra empresa o con el catálogo global).
export class CompetenciasPorEmpresa1788860000000 implements MigrationInterface {
  name = 'CompetenciasPorEmpresa1788860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "competencias" ADD "empresa_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "competencias"
      ADD CONSTRAINT "FK_competencias_empresa"
      FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "competencias" DROP CONSTRAINT "UQ_27c66a70b11a5f0db83b7e5373d"
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_competencias_nombre_global" ON "competencias" ("nombre")
      WHERE "empresa_id" IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_competencias_nombre_por_empresa" ON "competencias" ("empresa_id", "nombre")
      WHERE "empresa_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_competencias_nombre_por_empresa"`);
    await queryRunner.query(`DROP INDEX "UQ_competencias_nombre_global"`);
    await queryRunner.query(`
      ALTER TABLE "competencias" DROP CONSTRAINT "FK_competencias_empresa"
    `);
    await queryRunner.query(`
      ALTER TABLE "competencias" ADD CONSTRAINT "UQ_27c66a70b11a5f0db83b7e5373d" UNIQUE ("nombre")
    `);
    await queryRunner.query(`
      ALTER TABLE "competencias" DROP COLUMN "empresa_id"
    `);
  }
}
