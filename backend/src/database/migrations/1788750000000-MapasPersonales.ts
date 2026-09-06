import { MigrationInterface, QueryRunner } from 'typeorm';

export class MapasPersonales1788750000000 implements MigrationInterface {
  name = 'MapasPersonales1788750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "mapas_personales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "coachee_id" uuid NOT NULL,
        "titulo" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mapas_personales" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "mapas_personales"
      ADD CONSTRAINT "FK_mapas_personales_coachee" FOREIGN KEY ("coachee_id")
      REFERENCES "coachees"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      CREATE TABLE "nodos_mapa_personal" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mapa_id" uuid NOT NULL,
        "parent_id" uuid,
        "label" character varying NOT NULL,
        "detalle" text,
        "orden" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nodos_mapa_personal" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "nodos_mapa_personal"
      ADD CONSTRAINT "FK_nodos_mapa_personal_mapa" FOREIGN KEY ("mapa_id")
      REFERENCES "mapas_personales"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "nodos_mapa_personal"
      ADD CONSTRAINT "FK_nodos_mapa_personal_parent" FOREIGN KEY ("parent_id")
      REFERENCES "nodos_mapa_personal"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "nodos_mapa_personal"`);
    await queryRunner.query(`DROP TABLE "mapas_personales"`);
  }
}
