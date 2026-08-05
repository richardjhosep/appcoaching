import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PlanesDesarrolloService } from './planes-desarrollo.service';
import { PlanDesarrollo } from './entities/plan-desarrollo.entity';
import { ObjetivoEspecifico } from './entities/objetivo-especifico.entity';
import { ActividadEjecucion } from './entities/actividad-ejecucion.entity';
import { EstadoPlan } from './enums/estado-plan.enum';
import { CoacheesService } from '../coachees/coachees.service';
import { CompetenciasService } from '../competencias/competencias.service';
import { EmailService } from '../email/email.service';

type PartialPlan = Partial<PlanDesarrollo>;
type PartialObjetivo = Partial<ObjetivoEspecifico>;
type PartialActividad = Partial<ActividadEjecucion>;

describe('PlanesDesarrolloService', () => {
  let service: PlanesDesarrolloService;
  let planes: {
    findOne: jest.Mock<Promise<PartialPlan | null>, unknown[]>;
    find: jest.Mock<Promise<PartialPlan[]>, unknown[]>;
    create: jest.Mock<PartialPlan, [PartialPlan]>;
    save: jest.Mock<Promise<PartialPlan>, [PartialPlan]>;
  };
  let objetivos: {
    findOne: jest.Mock<Promise<PartialObjetivo | null>, unknown[]>;
    find: jest.Mock<Promise<PartialObjetivo[]>, unknown[]>;
    count: jest.Mock<Promise<number>, unknown[]>;
    exists: jest.Mock<Promise<boolean>, unknown[]>;
    create: jest.Mock<PartialObjetivo, [PartialObjetivo]>;
    save: jest.Mock<Promise<PartialObjetivo>, [PartialObjetivo]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let actividades: {
    findOne: jest.Mock<Promise<PartialActividad | null>, unknown[]>;
    find: jest.Mock<Promise<PartialActividad[]>, unknown[]>;
    create: jest.Mock<PartialActividad, [PartialActividad]>;
    save: jest.Mock<Promise<PartialActividad>, [PartialActividad]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let coachees: {
    findByUserId: jest.Mock<Promise<{ id: string } | null>, [string]>;
    findOneForActor: jest.Mock<Promise<Record<string, unknown>>, unknown[]>;
  };
  let competencias: { exists: jest.Mock<Promise<boolean>, [string]> };
  let email: { sendRecordatorioPlan: jest.Mock<Promise<void>, unknown[]> };
  let config: { get: jest.Mock };

  const ACTOR_USER_ID = 'user-1';
  const COACHEE_ID = 'coachee-1';

  beforeEach(() => {
    planes = {
      findOne: jest.fn<Promise<PartialPlan | null>, unknown[]>(),
      find: jest.fn<Promise<PartialPlan[]>, unknown[]>(),
      create: jest.fn((data: PartialPlan) => data),
      save: jest.fn((data: PartialPlan) =>
        Promise.resolve({ id: 'plan-1', ...data }),
      ),
    };
    objetivos = {
      findOne: jest.fn<Promise<PartialObjetivo | null>, unknown[]>(),
      find: jest.fn<Promise<PartialObjetivo[]>, unknown[]>(),
      count: jest.fn<Promise<number>, unknown[]>(),
      exists: jest.fn<Promise<boolean>, unknown[]>(),
      create: jest.fn((data: PartialObjetivo) => data),
      save: jest.fn((data: PartialObjetivo) =>
        Promise.resolve({ id: 'obj-1', ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    actividades = {
      findOne: jest.fn<Promise<PartialActividad | null>, unknown[]>(),
      find: jest.fn<Promise<PartialActividad[]>, unknown[]>(),
      create: jest.fn((data: PartialActividad) => data),
      save: jest.fn((data: PartialActividad) =>
        Promise.resolve({ id: 'act-1', ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    coachees = {
      findByUserId: jest.fn<Promise<{ id: string } | null>, [string]>(),
      findOneForActor: jest.fn<Promise<Record<string, unknown>>, unknown[]>(),
    };
    competencias = { exists: jest.fn<Promise<boolean>, [string]>() };
    email = { sendRecordatorioPlan: jest.fn<Promise<void>, unknown[]>() };
    config = { get: jest.fn(() => 'http://localhost:5183') };

    coachees.findByUserId.mockResolvedValue({ id: COACHEE_ID });
    objetivos.find.mockResolvedValue([]);
    actividades.find.mockResolvedValue([]);
    objetivos.exists.mockResolvedValue(true);

    service = new PlanesDesarrolloService(
      planes as unknown as Repository<PlanDesarrollo>,
      objetivos as unknown as Repository<ObjetivoEspecifico>,
      actividades as unknown as Repository<ActividadEjecucion>,
      coachees as unknown as CoacheesService,
      competencias as unknown as CompetenciasService,
      email as unknown as EmailService,
      config as unknown as ConfigService,
    );
  });

  describe('findAll', () => {
    it('loads coachee+empresa+user, competencia, objetivos and actividades for the list view', async () => {
      planes.find.mockResolvedValue([]);

      await service.findAll();

      expect(planes.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: {
            coachee: { empresa: true, user: true },
            competencia: true,
            objetivos: true,
            actividades: true,
          },
        }),
      );
    });

    it('filters by estado when provided', async () => {
      planes.find.mockResolvedValue([]);

      await service.findAll(EstadoPlan.APROBADO);

      expect(planes.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { estado: EstadoPlan.APROBADO } }),
      );
    });
  });

  describe('getOwn', () => {
    it('auto-creates a blank plan when the coachee has none yet', async () => {
      planes.findOne.mockResolvedValue(null);

      const plan = await service.getOwn(ACTOR_USER_ID);

      expect(plan.coacheeId).toBe(COACHEE_ID);
      expect(plan.estado).toBe(EstadoPlan.SIN_ENVIAR);
    });

    it('throws NotFoundException when the actor has no coachee profile', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(service.getOwn('user-x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOwn', () => {
    it('rejects editing gated fields while pending approval', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.PENDIENTE_APROBACION,
      });

      await expect(
        service.updateOwn(ACTOR_USER_ID, { objetivoGeneral: 'nuevo objetivo' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows editing free fields even while pending approval', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.PENDIENTE_APROBACION,
      });

      const plan = await service.updateOwn(ACTOR_USER_ID, { plazo: '2 meses' });

      expect(plan.plazo).toBe('2 meses');
    });

    it('rejects an unknown competenciaId', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.SIN_ENVIAR,
      });
      competencias.exists.mockResolvedValue(false);

      await expect(
        service.updateOwn(ACTOR_USER_ID, { competenciaId: 'missing' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('enviar', () => {
    it('rejects when required fields are missing', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.SIN_ENVIAR,
      });

      await expect(service.enviar(ACTOR_USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects when there are no objetivos específicos', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.SIN_ENVIAR,
        competenciaId: 'c1',
        nivelObjetivo: 4,
        objetivoGeneral: 'Ser más estratégico',
      });
      objetivos.count.mockResolvedValue(0);

      await expect(service.enviar(ACTOR_USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects when the plan is already pending approval', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.PENDIENTE_APROBACION,
      });

      await expect(service.enviar(ACTOR_USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('transitions to pendiente_aprobacion when everything is complete', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.CAMBIOS_SOLICITADOS,
        competenciaId: 'c1',
        nivelObjetivo: 4,
        objetivoGeneral: 'Ser más estratégico',
        comentarioCoach: 'Sé más específico',
      });
      objetivos.count.mockResolvedValue(2);

      const plan = await service.enviar(ACTOR_USER_ID);

      expect(plan.estado).toBe(EstadoPlan.PENDIENTE_APROBACION);
      expect(plan.comentarioCoach).toBeNull();
      expect(plan.enviadoEn).toBeInstanceOf(Date);
    });
  });

  describe('enviarRecordatorio', () => {
    const ACTOR = { id: 'coach-1' } as never;

    it("sends the reminder email to the coachee's account email", async () => {
      coachees.findOneForActor.mockResolvedValue({
        id: COACHEE_ID,
        nombre: 'Ana',
        user: { email: 'ana@example.com' },
      });

      await service.enviarRecordatorio(COACHEE_ID, ACTOR);

      expect(coachees.findOneForActor).toHaveBeenCalledWith(COACHEE_ID, ACTOR);
      expect(email.sendRecordatorioPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ana@example.com',
          nombreCoachee: 'Ana',
        }),
      );
    });

    it('throws NotFoundException when the coachee has no linked account email', async () => {
      coachees.findOneForActor.mockResolvedValue({
        id: COACHEE_ID,
        nombre: 'Ana',
        user: undefined,
      });

      await expect(
        service.enviarRecordatorio(COACHEE_ID, ACTOR),
      ).rejects.toThrow(NotFoundException);
      expect(email.sendRecordatorioPlan).not.toHaveBeenCalled();
    });
  });

  describe('aprobar', () => {
    it('rejects when the plan is not pending approval', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.SIN_ENVIAR,
      });

      await expect(service.aprobar(COACHEE_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('approves a pending plan', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.PENDIENTE_APROBACION,
      });

      const plan = await service.aprobar(COACHEE_ID);

      expect(plan.estado).toBe(EstadoPlan.APROBADO);
    });
  });

  describe('solicitarCambios', () => {
    it('rejects when the plan is not pending approval', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.APROBADO,
      });

      await expect(
        service.solicitarCambios(COACHEE_ID, 'falta detalle'),
      ).rejects.toThrow(ConflictException);
    });

    it('moves the plan to cambios_solicitados with the comment stored', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.PENDIENTE_APROBACION,
      });

      const plan = await service.solicitarCambios(
        COACHEE_ID,
        'Sé más específico en el objetivo',
      );

      expect(plan.estado).toBe(EstadoPlan.CAMBIOS_SOLICITADOS);
      expect(plan.comentarioCoach).toBe('Sé más específico en el objetivo');
    });
  });

  describe('objetivos específicos', () => {
    it('rejects adding an objetivo while pending approval', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.PENDIENTE_APROBACION,
      });

      await expect(
        service.addObjetivo(ACTOR_USER_ID, {
          descripcion: 'Practicar escucha activa',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('adds an objetivo with an auto-computed orden', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.SIN_ENVIAR,
      });
      objetivos.count.mockResolvedValue(2);

      const objetivo = await service.addObjetivo(ACTOR_USER_ID, {
        descripcion: 'Practicar escucha activa',
      });

      expect(objetivo.orden).toBe(3);
    });

    it('throws NotFoundException when removing an objetivo that is not owned', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.SIN_ENVIAR,
      });
      objetivos.delete.mockResolvedValue({ affected: 0 });

      await expect(
        service.removeObjetivo(ACTOR_USER_ID, 'other-plan-objetivo'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('hábito y formación (siempre de libre edición)', () => {
    it('saves habito/formación fields even while the plan is pending approval', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.PENDIENTE_APROBACION,
      });

      const plan = await service.updateOwn(ACTOR_USER_ID, {
        habitoCuando: 'Antes de reuniones con otras áreas',
        formacionLibros: 'Influence – Robert Cialdini',
      });

      expect(plan.habitoCuando).toBe('Antes de reuniones con otras áreas');
      expect(plan.formacionLibros).toBe('Influence – Robert Cialdini');
    });
  });

  describe('actividades de ejecución (plan de ejecución)', () => {
    it('adds an actividad linked to an objetivo of the same plan', async () => {
      planes.findOne.mockResolvedValue({ id: 'plan-1', coacheeId: COACHEE_ID });

      const actividad = await service.addActividad(ACTOR_USER_ID, {
        objetivoId: 'obj-1',
        actividad:
          'Preparar cada reunión clave con objetivo y pedido concreto.',
      });

      expect(actividad.planId).toBe('plan-1');
      expect(actividad.objetivoId).toBe('obj-1');
    });

    it('rejects an objetivoId that does not belong to the own plan', async () => {
      planes.findOne.mockResolvedValue({ id: 'plan-1', coacheeId: COACHEE_ID });
      objetivos.exists.mockResolvedValue(false);

      await expect(
        service.addActividad(ACTOR_USER_ID, {
          objetivoId: 'objetivo-de-otro-plan',
          actividad: 'Actividad inválida',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows adding an actividad even while the plan is pending approval', async () => {
      planes.findOne.mockResolvedValue({
        id: 'plan-1',
        coacheeId: COACHEE_ID,
        estado: EstadoPlan.PENDIENTE_APROBACION,
      });

      await expect(
        service.addActividad(ACTOR_USER_ID, {
          objetivoId: 'obj-1',
          actividad: 'Aplicar checklist previo en 2 reuniones',
        }),
      ).resolves.toBeDefined();
    });

    it('throws NotFoundException when updating an actividad from another plan', async () => {
      planes.findOne.mockResolvedValue({ id: 'plan-1', coacheeId: COACHEE_ID });
      actividades.findOne.mockResolvedValue(null);

      await expect(
        service.updateActividad(ACTOR_USER_ID, 'other-plan-actividad', {
          actividad: 'cambio no permitido',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when removing an actividad that is not owned', async () => {
      planes.findOne.mockResolvedValue({ id: 'plan-1', coacheeId: COACHEE_ID });
      actividades.delete.mockResolvedValue({ affected: 0 });

      await expect(
        service.removeActividad(ACTOR_USER_ID, 'other-plan-actividad'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
