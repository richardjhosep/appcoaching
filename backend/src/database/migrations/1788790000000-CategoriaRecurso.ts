import { MigrationInterface, QueryRunner } from 'typeorm';

export class CategoriaRecurso1788790000000 implements MigrationInterface {
  name = 'CategoriaRecurso1788790000000';

  // Backfill best-effort para recursos ya existentes: los nuevos se clasifican por
  // mimetype real al subir (ver categoria-recurso.util.ts), pero esos filas no lo
  // tienen guardado — para archivo se infiere por extensión del nombre, para link por
  // si apunta a una plataforma de video conocida. Todo lo demás queda NULL (sin
  // categoría) en vez de adivinar.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "recursos_categoria_enum" AS ENUM ('texto', 'audio', 'video')
    `);
    await queryRunner.query(`
      ALTER TABLE "recursos" ADD "categoria" "recursos_categoria_enum"
    `);
    await queryRunner.query(`
      UPDATE "recursos" SET "categoria" = 'texto'
      WHERE "tipo" = 'archivo' AND lower("archivo_nombre") ~ '\\.(pdf|docx?|xlsx?|csv)$'
    `);
    await queryRunner.query(`
      UPDATE "recursos" SET "categoria" = 'video'
      WHERE "tipo" = 'archivo' AND lower("archivo_nombre") ~ '\\.(mp4|mov|avi|webm)$'
    `);
    await queryRunner.query(`
      UPDATE "recursos" SET "categoria" = 'audio'
      WHERE "tipo" = 'archivo' AND lower("archivo_nombre") ~ '\\.(mp3|wav|ogg|m4a|aac)$'
    `);
    await queryRunner.query(`
      UPDATE "recursos" SET "categoria" = 'video'
      WHERE "tipo" = 'link' AND (
        "url" ~* '(youtube\\.com|youtu\\.be|vimeo\\.com)'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recursos" DROP COLUMN "categoria"`);
    await queryRunner.query(`DROP TYPE "recursos_categoria_enum"`);
  }
}
