import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificaciones1785012472580 implements MigrationInterface {
  name = 'AddNotificaciones1785012472580';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notificaciones_tipo_enum" AS ENUM('reagendamiento_solicitado', 'reagendamiento_resuelto')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notificaciones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "tipo" "public"."notificaciones_tipo_enum" NOT NULL, "mensaje" text NOT NULL, "link" character varying, "leida" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a9d32a419ff58b53a38b5ef85d4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "notificaciones" ADD CONSTRAINT "FK_0a5f87551149ecc486ee8477c5f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes_reagendamiento" ADD CONSTRAINT "FK_841245e14f5e61fd910a0a30b68" FOREIGN KEY ("coachee_id") REFERENCES "coachees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "solicitudes_reagendamiento" DROP CONSTRAINT "FK_841245e14f5e61fd910a0a30b68"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notificaciones" DROP CONSTRAINT "FK_0a5f87551149ecc486ee8477c5f"`,
    );
    await queryRunner.query(`DROP TABLE "notificaciones"`);
    await queryRunner.query(`DROP TYPE "public"."notificaciones_tipo_enum"`);
  }
}
