import { MigrationInterface, QueryRunner } from 'typeorm';

export class GestionRenovacionYConfirmacionSesion1788362342328 implements MigrationInterface {
  name = 'GestionRenovacionYConfirmacionSesion1788362342328';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "gestiones_renovacion" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "empresa_id" uuid NOT NULL,
        "nota" text NOT NULL,
        "proximo_seguimiento" date,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gestiones_renovacion" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "gestiones_renovacion" ADD CONSTRAINT "FK_gestiones_renovacion_empresa" FOREIGN KEY ("empresa_id")
      REFERENCES "empresas"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(
      `ALTER TABLE "sesiones" ADD COLUMN "confirmada" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sesiones" DROP COLUMN "confirmada"`);

    await queryRunner.query(
      `ALTER TABLE "gestiones_renovacion" DROP CONSTRAINT "FK_gestiones_renovacion_empresa"`,
    );
    await queryRunner.query(`DROP TABLE "gestiones_renovacion"`);
  }
}
