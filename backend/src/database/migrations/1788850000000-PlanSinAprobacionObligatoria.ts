import { MigrationInterface, QueryRunner } from 'typeorm';

// El plan de desarrollo dejó de requerir la aprobación explícita del coach (se
// auto-aprueba al enviarse — ver PlanesDesarrolloService.enviar). El estado
// "pendiente_aprobacion" ya no se produce desde el código, pero puede haber planes
// reales que quedaron ahí antes de este cambio: se migran a "aprobado" para que no
// se congelen a mitad de camino (sin esto, ese coachee seguiría bloqueado y su ciclo
// nunca podría cerrarse, ya que Ciclos.cerrar() exige estado = aprobado).
//
// El valor "pendiente_aprobacion" se deja en el tipo enum de Postgres (no se puede
// quitar un valor de un enum sin recrear el tipo) — queda inerte, no es alcanzable
// por ningún flujo nuevo.
export class PlanSinAprobacionObligatoria1788850000000 implements MigrationInterface {
  name = 'PlanSinAprobacionObligatoria1788850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "planes_desarrollo"
      SET "estado" = 'aprobado', "comentario_coach" = NULL
      WHERE "estado" = 'pendiente_aprobacion'
    `);
  }

  public async down(): Promise<void> {
    // No reversible: no hay forma de distinguir, entre los planes ahora "aprobado",
    // cuáles venían de "pendiente_aprobacion" versus cuáles llegaron ahí por el flujo
    // normal (enviar() ya los deja aprobados directamente).
  }
}
