import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoacheeActivo1784472711842 implements MigrationInterface {
  name = 'AddCoacheeActivo1784472711842';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coachees" ADD "activo" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "coachees" DROP COLUMN "activo"`);
  }
}
