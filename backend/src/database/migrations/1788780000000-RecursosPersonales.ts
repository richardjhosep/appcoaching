import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecursosPersonales1788780000000 implements MigrationInterface {
  name = 'RecursosPersonales1788780000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "recursos_personales_categoria_enum" AS ENUM (
        'libro', 'articulo', 'video', 'podcast', 'practica_guiada'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "recursos_personales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachee_id" uuid NOT NULL,
        "categoria" "recursos_personales_categoria_enum" NOT NULL,
        "titulo" character varying NOT NULL,
        "url" character varying,
        "notas" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recursos_personales" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "recursos_personales"
      ADD CONSTRAINT "FK_recursos_personales_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "recursos_personales"`);
    await queryRunner.query(`DROP TYPE "recursos_personales_categoria_enum"`);
  }
}
