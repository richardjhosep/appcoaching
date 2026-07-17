import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanDesarrollo } from './entities/plan-desarrollo.entity';
import { ObjetivoEspecifico } from './entities/objetivo-especifico.entity';
import { ActividadEjecucion } from './entities/actividad-ejecucion.entity';
import { EstadoPlan } from './enums/estado-plan.enum';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateObjetivoDto } from './dto/create-objetivo.dto';
import { UpdateObjetivoDto } from './dto/update-objetivo.dto';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { CoacheesService } from '../coachees/coachees.service';
import { CompetenciasService } from '../competencias/competencias.service';
import { assignDefined } from '../common/assign-defined.util';

const GATED_FIELDS = [
  'competenciaId',
  'nivelObjetivo',
  'objetivoGeneral',
] as const;

@Injectable()
export class PlanesDesarrolloService {
  constructor(
    @InjectRepository(PlanDesarrollo)
    private readonly planes: Repository<PlanDesarrollo>,
    @InjectRepository(ObjetivoEspecifico)
    private readonly objetivos: Repository<ObjetivoEspecifico>,
    @InjectRepository(ActividadEjecucion)
    private readonly actividades: Repository<ActividadEjecucion>,
    private readonly coachees: CoacheesService,
    private readonly competencias: CompetenciasService,
  ) {}

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    return coachee.id;
  }

  private async findOrCreateForCoachee(
    coacheeId: string,
  ): Promise<PlanDesarrollo> {
    let plan = await this.planes.findOne({ where: { coacheeId } });
    if (!plan) {
      plan = await this.planes.save(
        this.planes.create({ coacheeId, estado: EstadoPlan.SIN_ENVIAR }),
      );
    }
    return plan;
  }

  private async withObjetivos(plan: PlanDesarrollo): Promise<PlanDesarrollo> {
    [plan.objetivos, plan.actividades] = await Promise.all([
      this.objetivos.find({
        where: { planId: plan.id },
        order: { orden: 'ASC' },
      }),
      this.actividades.find({
        where: { planId: plan.id },
        order: { createdAt: 'ASC' },
      }),
    ]);
    return plan;
  }

  async getOwn(actorUserId: string): Promise<PlanDesarrollo> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);
    return this.withObjetivos(plan);
  }

  async getByCoacheeId(coacheeId: string): Promise<PlanDesarrollo> {
    const plan = await this.planes.findOne({
      where: { coacheeId },
      relations: { coachee: true },
    });
    if (!plan) {
      throw new NotFoundException('Plan de desarrollo not found');
    }
    return this.withObjetivos(plan);
  }

  findAll(estado?: EstadoPlan): Promise<PlanDesarrollo[]> {
    return this.planes.find({
      where: estado ? { estado } : {},
      relations: { coachee: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async updateOwn(
    actorUserId: string,
    dto: UpdatePlanDto,
  ): Promise<PlanDesarrollo> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);

    const touchesGatedField = GATED_FIELDS.some(
      (field) => dto[field] !== undefined,
    );
    if (plan.estado === EstadoPlan.PENDIENTE_APROBACION && touchesGatedField) {
      throw new ForbiddenException(
        'El plan está pendiente de aprobación: la competencia, el nivel objetivo y el objetivo general no se pueden editar hasta que el coach responda.',
      );
    }

    if (
      dto.competenciaId !== undefined &&
      !(await this.competencias.exists(dto.competenciaId))
    ) {
      throw new NotFoundException('Competencia not found');
    }

    assignDefined(plan, dto);
    await this.planes.save(plan);
    return this.withObjetivos(plan);
  }

  async enviar(actorUserId: string): Promise<PlanDesarrollo> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);

    if (plan.estado === EstadoPlan.PENDIENTE_APROBACION) {
      throw new ConflictException('El plan ya está pendiente de aprobación.');
    }
    if (!plan.competenciaId || !plan.nivelObjetivo || !plan.objetivoGeneral) {
      throw new BadRequestException(
        'Para enviar el plan debes definir competencia, nivel objetivo y objetivo general.',
      );
    }
    const objetivosCount = await this.objetivos.count({
      where: { planId: plan.id },
    });
    if (objetivosCount === 0) {
      throw new BadRequestException(
        'Debes definir al menos un objetivo específico.',
      );
    }

    plan.estado = EstadoPlan.PENDIENTE_APROBACION;
    plan.comentarioCoach = null;
    await this.planes.save(plan);
    return this.withObjetivos(plan);
  }

  async aprobar(coacheeId: string): Promise<PlanDesarrollo> {
    const plan = await this.getByCoacheeId(coacheeId);
    if (plan.estado !== EstadoPlan.PENDIENTE_APROBACION) {
      throw new ConflictException('El plan no está pendiente de aprobación.');
    }
    plan.estado = EstadoPlan.APROBADO;
    plan.comentarioCoach = null;
    await this.planes.save(plan);
    return this.withObjetivos(plan);
  }

  async solicitarCambios(
    coacheeId: string,
    comentario: string,
  ): Promise<PlanDesarrollo> {
    const plan = await this.getByCoacheeId(coacheeId);
    if (plan.estado !== EstadoPlan.PENDIENTE_APROBACION) {
      throw new ConflictException('El plan no está pendiente de aprobación.');
    }
    plan.estado = EstadoPlan.CAMBIOS_SOLICITADOS;
    plan.comentarioCoach = comentario;
    await this.planes.save(plan);
    return this.withObjetivos(plan);
  }

  private async ownPlanNotLocked(actorUserId: string): Promise<PlanDesarrollo> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);
    if (plan.estado === EstadoPlan.PENDIENTE_APROBACION) {
      throw new ForbiddenException(
        'El plan está pendiente de aprobación: los objetivos específicos no se pueden editar hasta que el coach responda.',
      );
    }
    return plan;
  }

  async addObjetivo(
    actorUserId: string,
    dto: CreateObjetivoDto,
  ): Promise<ObjetivoEspecifico> {
    const plan = await this.ownPlanNotLocked(actorUserId);
    const orden =
      dto.orden ??
      (await this.objetivos.count({ where: { planId: plan.id } })) + 1;
    return this.objetivos.save(
      this.objetivos.create({
        planId: plan.id,
        descripcion: dto.descripcion,
        orden,
      }),
    );
  }

  async updateObjetivo(
    actorUserId: string,
    objetivoId: string,
    dto: UpdateObjetivoDto,
  ): Promise<ObjetivoEspecifico> {
    const plan = await this.ownPlanNotLocked(actorUserId);
    const objetivo = await this.objetivos.findOne({
      where: { id: objetivoId, planId: plan.id },
    });
    if (!objetivo) {
      throw new NotFoundException('Objetivo not found');
    }
    assignDefined(objetivo, dto);
    return this.objetivos.save(objetivo);
  }

  async removeObjetivo(actorUserId: string, objetivoId: string): Promise<void> {
    const plan = await this.ownPlanNotLocked(actorUserId);
    const result = await this.objetivos.delete({
      id: objetivoId,
      planId: plan.id,
    });
    if (!result.affected) {
      throw new NotFoundException('Objetivo not found');
    }
  }

  // El plan de ejecución es de libre edición (igual que hábito/formación): no se
  // bloquea mientras el plan está pendiente de aprobación.

  private async assertObjetivoBelongsToPlan(
    objetivoId: string,
    planId: string,
  ): Promise<void> {
    const exists = await this.objetivos.exists({
      where: { id: objetivoId, planId },
    });
    if (!exists) {
      throw new NotFoundException('Objetivo not found in this plan');
    }
  }

  async addActividad(
    actorUserId: string,
    dto: CreateActividadDto,
  ): Promise<ActividadEjecucion> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);
    await this.assertObjetivoBelongsToPlan(dto.objetivoId, plan.id);

    return this.actividades.save(
      this.actividades.create({
        planId: plan.id,
        objetivoId: dto.objetivoId,
        actividad: dto.actividad,
        fechaInicio: dto.fechaInicio ?? null,
        fechaFin: dto.fechaFin ?? null,
        estado: dto.estado,
      }),
    );
  }

  async updateActividad(
    actorUserId: string,
    actividadId: string,
    dto: UpdateActividadDto,
  ): Promise<ActividadEjecucion> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);
    const actividad = await this.actividades.findOne({
      where: { id: actividadId, planId: plan.id },
    });
    if (!actividad) {
      throw new NotFoundException('Actividad not found');
    }
    if (dto.objetivoId !== undefined) {
      await this.assertObjetivoBelongsToPlan(dto.objetivoId, plan.id);
    }
    assignDefined(actividad, dto);
    return this.actividades.save(actividad);
  }

  async removeActividad(
    actorUserId: string,
    actividadId: string,
  ): Promise<void> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);
    const result = await this.actividades.delete({
      id: actividadId,
      planId: plan.id,
    });
    if (!result.affected) {
      throw new NotFoundException('Actividad not found');
    }
  }
}
