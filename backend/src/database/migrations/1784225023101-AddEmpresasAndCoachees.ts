import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmpresasAndCoachees1784225023101 implements MigrationInterface {
  name = 'AddEmpresasAndCoachees1784225023101';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "empresas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying NOT NULL, "tarifa_hora" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7a75c61d17a9cba267133a6fc68" UNIQUE ("nombre"), CONSTRAINT "PK_ce7b122b37c6499bfd6520873e1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "coachees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying NOT NULL, "user_id" uuid NOT NULL, "empresa_id" uuid, "tarifa_propia" integer, "jefe_directo" character varying, "objetivo_proceso" text, "telefono" character varying, "email_contacto" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f4ba74548b80f8856694c08043b" UNIQUE ("user_id"), CONSTRAINT "REL_f4ba74548b80f8856694c08043" UNIQUE ("user_id"), CONSTRAINT "PK_442ec12163cf561662b4c20112e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "empresa_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_47392add05643b67732b121fd13" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" ADD CONSTRAINT "FK_f4ba74548b80f8856694c08043b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" ADD CONSTRAINT "FK_ae73d66da86c21f9717def4d9f2" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coachees" DROP CONSTRAINT "FK_ae73d66da86c21f9717def4d9f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coachees" DROP CONSTRAINT "FK_f4ba74548b80f8856694c08043b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_47392add05643b67732b121fd13"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "empresa_id"`);
    await queryRunner.query(`DROP TABLE "coachees"`);
    await queryRunner.query(`DROP TABLE "empresas"`);
  }
}
