import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImpactoNegocioCiclo1788623448884 implements MigrationInterface {
  name = 'ImpactoNegocioCiclo1788623448884';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ciclos_coaching" ADD COLUMN "impacto_negocio" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ciclos_coaching" DROP COLUMN "impacto_negocio"`,
    );
  }
}
