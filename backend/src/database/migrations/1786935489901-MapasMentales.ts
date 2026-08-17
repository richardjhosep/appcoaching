import { MigrationInterface, QueryRunner } from 'typeorm';

export class MapasMentales1786935489901 implements MigrationInterface {
  name = 'MapasMentales1786935489901';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "mapas_mentales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "titulo" character varying NOT NULL,
        "competencia_id" uuid NOT NULL,
        "recurso_id" uuid,
        "activo" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_mapas_mentales" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "nodos_mapa" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "mapa_id" uuid NOT NULL,
        "parent_id" uuid,
        "label" character varying NOT NULL,
        "detalle" text,
        "orden" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nodos_mapa" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "mapas_mentales" ADD CONSTRAINT "FK_mapas_mentales_competencia" FOREIGN KEY ("competencia_id")
      REFERENCES "competencias"("id") ON DELETE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "mapas_mentales" ADD CONSTRAINT "FK_mapas_mentales_recurso" FOREIGN KEY ("recurso_id")
      REFERENCES "recursos"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "nodos_mapa" ADD CONSTRAINT "FK_nodos_mapa_mapa" FOREIGN KEY ("mapa_id")
      REFERENCES "mapas_mentales"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "nodos_mapa" ADD CONSTRAINT "FK_nodos_mapa_parent" FOREIGN KEY ("parent_id")
      REFERENCES "nodos_mapa"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "nodos_mapa"`);
    await queryRunner.query(`DROP TABLE "mapas_mentales"`);
  }
}
