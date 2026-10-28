import { MigrationInterface, QueryRunner } from 'typeorm';

// Ley 21.719: los datos de salud mental, vida afectiva y las evaluaciones psicométricas son datos
// sensibles y exigen un consentimiento propio, explícito y revocable — distinto del consentimiento
// informado del proceso. Se guarda cuándo y con qué versión del texto se aceptó.
export class ConsentimientoDatosSensibles1788930000000 implements MigrationInterface {
  name = 'ConsentimientoDatosSensibles1788930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coachees" ADD "consentimiento_sensibles" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" ADD "consentimiento_sensibles_fecha" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" ADD "consentimiento_sensibles_version" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coachees" DROP COLUMN "consentimiento_sensibles_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" DROP COLUMN "consentimiento_sensibles_fecha"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" DROP COLUMN "consentimiento_sensibles"`,
    );
  }
}
