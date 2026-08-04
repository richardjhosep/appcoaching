import { MigrationInterface, QueryRunner } from 'typeorm';

export class DiarioComoHistorial1785627682879 implements MigrationInterface {
  name = 'DiarioComoHistorial1785627682879';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" DROP CONSTRAINT "FK_1b0c07a0bf7a7348e369abf7f80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" DROP CONSTRAINT "UQ_1b0c07a0bf7a7348e369abf7f80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" ALTER COLUMN "contenido" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" ADD CONSTRAINT "FK_1b0c07a0bf7a7348e369abf7f80" FOREIGN KEY ("coachee_id") REFERENCES "coachees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" DROP CONSTRAINT "FK_1b0c07a0bf7a7348e369abf7f80"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" ALTER COLUMN "contenido" SET DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" ADD CONSTRAINT "UQ_1b0c07a0bf7a7348e369abf7f80" UNIQUE ("coachee_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" ADD CONSTRAINT "FK_1b0c07a0bf7a7348e369abf7f80" FOREIGN KEY ("coachee_id") REFERENCES "coachees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }
}
