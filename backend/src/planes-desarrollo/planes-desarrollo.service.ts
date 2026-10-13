import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
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
import { EmailService } from '../email/email.service';
import { assignDefined } from '../common/assign-defined.util';
import type { AuthenticatedUser } from '../auth/auth.types';

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
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
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
      relations: { coachee: true, competencia: true },
    });
    if (!plan) {
      throw new NotFoundException('Plan de desarrollo no encontrado.');
    }
    return this.withObjetivos(plan);
  }

  findAll(estado?: EstadoPlan): Promise<PlanDesarrollo[]> {
    return this.planes.find({
      where: estado ? { estado } : {},
      relations: {
        coachee: { empresa: true, user: true },
        competencia: true,
        objetivos: true,
        actividades: true,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async enviarRecordatorio(
    coacheeId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const coachee = await this.coachees.findOneForActor(coacheeId, actor);
    if (!coachee.user?.email) {
      throw new NotFoundException(
        'Este coachee no tiene una cuenta con correo asociada.',
      );
    }
    const verUrl = `${this.config.get<string>('frontendUrl')}/coachee/plan`;
    await this.email.sendRecordatorioPlan({
      to: coachee.user.email,
      nombreCoachee: coachee.nombre,
      verUrl,
    });
  }

  async updateOwn(
    actorUserId: string,
    dto: UpdatePlanDto,
  ): Promise<PlanDesarrollo> {
    if (dto.competenciaId !== undefined) {
      // No solo "existe": tiene que ser del catálogo global o de la propia empresa del
      // coachee — si no, un coachee curioso podría fijar en su plan una competencia
      // interna de OTRA empresa adivinando/probando su UUID.
      const coachee = await this.coachees.findByUserId(actorUserId);
      if (!coachee) {
        throw new NotFoundException('Perfil de coachee no encontrado.');
      }
      if (
        !(await this.competencias.existsVisibleFor(
          dto.competenciaId,
          coachee.empresaId,
        ))
      ) {
        throw new NotFoundException('Competencia no encontrada.');
      }
    }

    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);
    assignDefined(plan, dto);
    await this.planes.save(plan);
    return this.withObjetivos(plan);
  }

  // El coach elige qué competencia le corresponde desarrollar a un coachee puntual — a
  // diferencia de EmpresaCompetencia (que prioriza lo mismo para TODA la empresa), esto es
  // por coachee. No queda bloqueada: el coachee la puede seguir cambiando después, igual
  // que cualquier otro campo del plan (ver comentario sobre libre edición más abajo).
  async asignarCompetencia(
    coacheeId: string,
    competenciaId: string,
    actor: AuthenticatedUser,
  ): Promise<PlanDesarrollo> {
    const coachee = await this.coachees.findOneForActor(coacheeId, actor);
    if (
      !(await this.competencias.existsVisibleFor(
        competenciaId,
        coachee.empresaId,
      ))
    ) {
      throw new NotFoundException('Competencia no encontrada.');
    }
    const plan = await this.findOrCreateForCoachee(coacheeId);
    plan.competenciaId = competenciaId;
    await this.planes.save(plan);
    return this.withObjetivos(plan);
  }

  async setTrabajarNiveles(
    coacheeId: string,
    trabajarNiveles: boolean,
    actor: AuthenticatedUser,
  ): Promise<PlanDesarrollo> {
    await this.coachees.findOneForActor(coacheeId, actor);
    const plan = await this.findOrCreateForCoachee(coacheeId);
    plan.trabajarNiveles = trabajarNiveles;
    await this.planes.save(plan);
    return this.withObjetivos(plan);
  }

  // No requiere aprobación del coach: enviar marca el plan como completo y queda
  // aprobado de inmediato (el coach puede seguir dejando comentarios en cualquier
  // momento vía solicitarCambios, pero ya no bloquea el avance del coachee).
  async enviar(actorUserId: string): Promise<PlanDesarrollo> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);

    if (!plan.competenciaId || !plan.objetivoGeneral) {
      throw new BadRequestException(
        'Para enviar el plan debes definir la competencia asociada y el objetivo general.',
      );
    }
    if (plan.trabajarNiveles && !plan.nivelObjetivo) {
      throw new BadRequestException(
        'Para enviar el plan debes definir el nivel objetivo de la competencia.',
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

    plan.estado = EstadoPlan.APROBADO;
    plan.comentarioCoach = null;
    plan.enviadoEn = new Date();
    await this.planes.save(plan);
    return this.withObjetivos(plan);
  }

  // El coach puede pedir cambios en cualquier momento después del envío — no hay una
  // ventana de "pendiente" que lo condicione. El coachee sigue con edición libre
  // mientras tanto; esto es sólo una señal visible de que el coach dejó feedback.
  async solicitarCambios(
    coacheeId: string,
    comentario: string,
  ): Promise<PlanDesarrollo> {
    const plan = await this.getByCoacheeId(coacheeId);
    if (plan.estado === EstadoPlan.SIN_ENVIAR) {
      throw new ConflictException('El coachee todavía no ha enviado su plan.');
    }
    plan.estado = EstadoPlan.CAMBIOS_SOLICITADOS;
    plan.comentarioCoach = comentario;
    await this.planes.save(plan);
    return this.withObjetivos(plan);
  }

  async addObjetivo(
    actorUserId: string,
    dto: CreateObjetivoDto,
  ): Promise<ObjetivoEspecifico> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);
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
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);
    const objetivo = await this.objetivos.findOne({
      where: { id: objetivoId, planId: plan.id },
    });
    if (!objetivo) {
      throw new NotFoundException('Objetivo no encontrado.');
    }
    assignDefined(objetivo, dto);
    return this.objetivos.save(objetivo);
  }

  async removeObjetivo(actorUserId: string, objetivoId: string): Promise<void> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const plan = await this.findOrCreateForCoachee(coacheeId);
    const result = await this.objetivos.delete({
      id: objetivoId,
      planId: plan.id,
    });
    if (!result.affected) {
      throw new NotFoundException('Objetivo no encontrado.');
    }
  }

  // El plan de ejecución es de libre edición (igual que hábito/formación e, incluso
  // ahora, que la definición y los objetivos específicos): nada en el plan se bloquea
  // por su estado.

  private async assertObjetivoBelongsToPlan(
    objetivoId: string,
    planId: string,
  ): Promise<void> {
    const exists = await this.objetivos.exists({
      where: { id: objetivoId, planId },
    });
    if (!exists) {
      throw new NotFoundException('Objetivo no encontrado en este plan.');
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
      throw new NotFoundException('Actividad no encontrada.');
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
      throw new NotFoundException('Actividad no encontrada.');
    }
  }
}
