import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Role } from '../auth/enums/role.enum';

/**
 * Acciones que forman parte de la auditoría del PROCESO DE COACHING (planes,
 * ciclos, documentos legales, consentimiento, altas/bajas de la relación) —
 * lo que ve por defecto la pestaña Auditoría de Legal. Deja fuera a propósito
 * el ruido de seguridad de la app (login/logout/contraseñas/activación de
 * cuentas), que sigue quedando registrado pero solo visible con `scope=todo`.
 */
export const ACCIONES_COACHING = [
  'PLAN_APROBADO',
  'PLAN_CAMBIOS_SOLICITADOS',
  'CICLO_CERRADO',
  'COACHEE_ELIMINADO',
  'EMPRESA_ELIMINADA',
  'DOCUMENTO_LEGAL_ACTUALIZADO',
  'DOCUMENTO_ADICIONAL_SUBIDO',
  'CONSENTIMIENTO_ACTUALIZADO',
  'SOLICITUD_CONSENTIMIENTO_ENVIADA',
];

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Coachee) private readonly coachees: Repository<Coachee>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
  ) {}

  async record(
    action: string,
    options: {
      userId?: string | null;
      targetType?: string;
      targetId?: string;
      /**
       * Nombre/etiqueta legible del target, capturada por el caller ANTES de
       * borrar la entidad. Obligatorio para acciones *_ELIMINADO/*_ELIMINADA:
       * para ese momento la fila ya no existe y resolverLabelTarget() no
       * encontraría nada. Para el resto de las acciones es opcional — si no
       * se pasa, se intenta resolver automáticamente por targetType/targetId.
       */
      targetLabel?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<void> {
    const [actorLabel, targetLabel] = await Promise.all([
      options.userId ? this.resolverLabelActor(options.userId) : null,
      options.targetLabel !== undefined
        ? options.targetLabel
        : this.resolverLabelTarget(options.targetType, options.targetId),
    ]);

    await this.logs.save(
      this.logs.create({
        action,
        userId: options.userId ?? null,
        targetType: options.targetType ?? null,
        targetId: options.targetId ?? null,
        actorLabel,
        targetLabel,
        metadata: options.metadata ?? null,
      }),
    );
  }

  find(filtros: {
    targetId?: string;
    action?: string;
    scope?: 'coaching' | 'todo';
    /** Fechas `YYYY-MM-DD` (día local del filtro, inclusive en ambos extremos). */
    desde?: string;
    hasta?: string;
  }): Promise<AuditLog[]> {
    const where: Record<string, unknown> = {};
    if (filtros.targetId) where.targetId = filtros.targetId;
    if (filtros.action) {
      where.action = filtros.action;
    } else if (filtros.scope !== 'todo') {
      where.action = In(ACCIONES_COACHING);
    }
    if (filtros.desde || filtros.hasta) {
      const desde = filtros.desde
        ? new Date(`${filtros.desde}T00:00:00`)
        : new Date(0);
      const hasta = filtros.hasta
        ? new Date(`${filtros.hasta}T23:59:59.999`)
        : new Date();
      where.createdAt = Between(desde, hasta);
    }
    return this.logs.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  private async resolverLabelActor(userId: string): Promise<string | null> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) return null;

    if (user.role === Role.COACHEE) {
      const coachee = await this.coachees.findOne({ where: { userId } });
      return coachee ? `Coachee ${coachee.nombre}` : `Coachee (${user.email})`;
    }
    if (user.role === Role.COACH) return `Coach (${user.email})`;
    return `Empresa (${user.email})`;
  }

  private async resolverLabelTarget(
    targetType?: string,
    targetId?: string,
  ): Promise<string | null> {
    if (!targetType || !targetId) return null;

    switch (targetType) {
      case 'Coachee': {
        const coachee = await this.coachees.findOne({
          where: { id: targetId },
        });
        return coachee?.nombre ?? null;
      }
      case 'Empresa': {
        const empresa = await this.empresas.findOne({
          where: { id: targetId },
        });
        return empresa?.nombre ?? null;
      }
      case 'User': {
        const user = await this.users.findOne({ where: { id: targetId } });
        return user?.email ?? null;
      }
      default:
        return null;
    }
  }
}
