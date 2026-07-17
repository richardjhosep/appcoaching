import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostSesionLogroDiario1784239404405 implements MigrationInterface {
  name = 'AddPostSesionLogroDiario1784239404405';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "entradas_diario" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coachee_id" uuid NOT NULL, "contenido" text NOT NULL DEFAULT '', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1b0c07a0bf7a7348e369abf7f80" UNIQUE ("coachee_id"), CONSTRAINT "REL_1b0c07a0bf7a7348e369abf7f8" UNIQUE ("coachee_id"), CONSTRAINT "PK_214660d2df1aa8c696a8546033e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "logros" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coachee_id" uuid NOT NULL, "fecha" character varying NOT NULL, "descripcion" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bd52f5cf67c45f813a1508f663b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_sesiones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sesion_id" uuid NOT NULL, "aprendizaje" text, "utilidad" integer, "cercania_objetivo" integer, "recomendacion" text, "temas_proxima_sesion" text, "publicada" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_48990b4336b6dc2245a72c8d619" UNIQUE ("sesion_id"), CONSTRAINT "REL_48990b4336b6dc2245a72c8d61" UNIQUE ("sesion_id"), CONSTRAINT "PK_d9f87371badc2d39c400e16beaa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" ADD CONSTRAINT "FK_1b0c07a0bf7a7348e369abf7f80" FOREIGN KEY ("coachee_id") REFERENCES "coachees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "logros" ADD CONSTRAINT "FK_8d65aeb0625f468a433a9cf6170" FOREIGN KEY ("coachee_id") REFERENCES "coachees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_sesiones" ADD CONSTRAINT "FK_48990b4336b6dc2245a72c8d619" FOREIGN KEY ("sesion_id") REFERENCES "sesiones"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_sesiones" DROP CONSTRAINT "FK_48990b4336b6dc2245a72c8d619"`,
    );
    await queryRunner.query(
      `ALTER TABLE "logros" DROP CONSTRAINT "FK_8d65aeb0625f468a433a9cf6170"`,
    );
    await queryRunner.query(
      `ALTER TABLE "entradas_diario" DROP CONSTRAINT "FK_1b0c07a0bf7a7348e369abf7f80"`,
    );
    await queryRunner.query(`DROP TABLE "post_sesiones"`);
    await queryRunner.query(`DROP TABLE "logros"`);
    await queryRunner.query(`DROP TABLE "entradas_diario"`);
  }
}
