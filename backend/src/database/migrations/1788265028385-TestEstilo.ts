import { MigrationInterface, QueryRunner } from 'typeorm';

export class TestEstilo1788265028385 implements MigrationInterface {
  name = 'TestEstilo1788265028385';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tests_estilo" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titulo" character varying NOT NULL,
        "descripcion" text,
        "competencia_id" uuid,
        "activo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tests_estilo" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "preguntas_estilo" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "test_estilo_id" uuid NOT NULL,
        "opcion_a" text NOT NULL,
        "categoria_a" character varying NOT NULL,
        "opcion_b" text NOT NULL,
        "categoria_b" character varying NOT NULL,
        "orden" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_preguntas_estilo" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "intentos_estilo" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "test_estilo_id" uuid NOT NULL,
        "coachee_id" uuid NOT NULL,
        "respuestas" jsonb NOT NULL,
        "resultado" jsonb NOT NULL,
        "categoria_dominante" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_intentos_estilo" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "tests_estilo" ADD CONSTRAINT "FK_tests_estilo_competencia" FOREIGN KEY ("competencia_id")
      REFERENCES "competencias"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "preguntas_estilo" ADD CONSTRAINT "FK_preguntas_estilo_test" FOREIGN KEY ("test_estilo_id")
      REFERENCES "tests_estilo"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "intentos_estilo" ADD CONSTRAINT "FK_intentos_estilo_test" FOREIGN KEY ("test_estilo_id")
      REFERENCES "tests_estilo"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "intentos_estilo" ADD CONSTRAINT "FK_intentos_estilo_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "intentos_estilo"`);
    await queryRunner.query(`DROP TABLE "preguntas_estilo"`);
    await queryRunner.query(`DROP TABLE "tests_estilo"`);
  }
}
