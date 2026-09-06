import { MigrationInterface, QueryRunner } from 'typeorm';

export class Pizarra1788760000000 implements MigrationInterface {
  name = 'Pizarra1788760000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notas_pizarra" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachee_id" uuid NOT NULL,
        "texto" text NOT NULL DEFAULT '',
        "color" character varying NOT NULL,
        "pos_x" integer NOT NULL,
        "pos_y" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notas_pizarra" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "notas_pizarra"
      ADD CONSTRAINT "FK_notas_pizarra_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notas_pizarra"`);
  }
}
