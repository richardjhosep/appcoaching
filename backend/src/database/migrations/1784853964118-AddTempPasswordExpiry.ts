import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTempPasswordExpiry1784853964118 implements MigrationInterface {
  name = 'AddTempPasswordExpiry1784853964118';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "temp_password_expires_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "temp_password_expires_at"`,
    );
  }
}
