import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmpresaCompetencias1788830000000 implements MigrationInterface {
  name = 'EmpresaCompetencias1788830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "empresa_competencias" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "competencia_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_empresa_competencias" UNIQUE ("empresa_id", "competencia_id"),
        CONSTRAINT "PK_empresa_competencias" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "empresa_competencias"
      ADD CONSTRAINT "FK_empresa_competencias_empresa" FOREIGN KEY ("empresa_id")
      REFERENCES "empresas"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "empresa_competencias"
      ADD CONSTRAINT "FK_empresa_competencias_competencia" FOREIGN KEY ("competencia_id")
      REFERENCES "competencias"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "empresa_competencias"`);
  }
}
