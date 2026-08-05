import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnviadoEnAPlanesDesarrollo1785929030584 implements MigrationInterface {
  name = 'AddEnviadoEnAPlanesDesarrollo1785929030584';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" ADD "enviado_en" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "planes_desarrollo" DROP COLUMN "enviado_en"`,
    );
  }
}
