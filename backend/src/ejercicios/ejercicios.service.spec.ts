import { ConflictException, NotFoundException } from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { EjerciciosService } from './ejercicios.service';
import { Ejercicio } from './entities/ejercicio.entity';
import { VersionEjercicio } from './entities/version-ejercicio.entity';
import { CoacheesService } from '../coachees/coachees.service';
import { CompetenciasService } from '../competencias/competencias.service';
import { PlanesDesarrolloService } from '../planes-desarrollo/planes-desarrollo.service';
import { EstadoVersionEjercicio } from './enums/estado-version-ejercicio.enum';
import { finDelDiaChileAUtc } from '../common/chile-time.util';

type PartialEjercicio = Partial<Ejercicio>;
type PartialVersion = Partial<VersionEjercicio>;

describe('EjerciciosService', () => {
  let service: EjerciciosService;
  let ejercicios: {
    findOne: jest.Mock<Promise<PartialEjercicio | null>, unknown[]>;
    find: jest.Mock<Promise<PartialEjercicio[]>, unknown[]>;
    create: jest.Mock<PartialEjercicio, [PartialEjercicio]>;
    save: jest.Mock<Promise<PartialEjercicio>, [PartialEjercicio]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let versiones: {
    find: jest.Mock<Promise<PartialVersion[]>, unknown[]>;
    findOne: jest.Mock<Promise<PartialVersion | null>, unknown[]>;
    count: jest.Mock<Promise<number>, unknown[]>;
    exists: jest.Mock<Promise<boolean>, unknown[]>;
    create: jest.Mock<PartialVersion, [PartialVersion]>;
    save: jest.Mock<Promise<PartialVersion>, [PartialVersion]>;
  };
  let coachees: { findByUserId: jest.Mock };
  let competencias: { exists: jest.Mock };
  let planesDesarrollo: { getByCoacheeId: jest.Mock };

  const ACTOR_USER_ID = 'user-1';
  const COACHEE_ID = 'coachee-1';
  const EJERCICIO_ID = 'ejercicio-1';

  beforeEach(() => {
    ejercicios = {
      findOne: jest.fn<Promise<PartialEjercicio | null>, unknown[]>(),
      find: jest.fn<Promise<PartialEjercicio[]>, unknown[]>(),
      create: jest.fn((data: PartialEjercicio) => data),
      save: jest.fn((data: PartialEjercicio) =>
        Promise.resolve({ id: EJERCICIO_ID, ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    versiones = {
      find: jest.fn<Promise<PartialVersion[]>, unknown[]>(),
      findOne: jest.fn<Promise<PartialVersion | null>, unknown[]>(),
      count: jest.fn<Promise<number>, unknown[]>(),
      exists: jest.fn<Promise<boolean>, unknown[]>(),
      create: jest.fn((data: PartialVersion) => data),
      save: jest.fn((data: PartialVersion) =>
        Promise.resolve({ id: 'version-1', ...data }),
      ),
    };
    coachees = { findByUserId: jest.fn() };
    competencias = { exists: jest.fn() };
    planesDesarrollo = { getByCoacheeId: jest.fn() };

    coachees.findByUserId.mockResolvedValue({ id: COACHEE_ID });

    service = new EjerciciosService(
      ejercicios as unknown as Repository<Ejercicio>,
      versiones as unknown as Repository<VersionEjercicio>,
      coachees as unknown as CoacheesService,
      competencias as unknown as CompetenciasService,
      planesDesarrollo as unknown as PlanesDesarrolloService,
    );
  });

  describe('disponiblesParaCoachee', () => {
    it('shows only competencia-matched + universal (no competencia) ejercicios when the coachee has a plan', async () => {
      planesDesarrollo.getByCoacheeId.mockResolvedValue({
        competenciaId: 'comp-1',
      });
      ejercicios.find.mockResolvedValue([]);

      await service.disponiblesParaCoachee(ACTOR_USER_ID);

      expect(ejercicios.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { activo: true, competenciaId: 'comp-1' },
            { activo: true, competenciaId: IsNull() },
          ],
        }),
      );
    });

    it('shows only universal (no competencia) ejercicios when the coachee has no plan yet', async () => {
      planesDesarrollo.getByCoacheeId.mockRejectedValue(
        new NotFoundException(),
      );
      ejercicios.find.mockResolvedValue([]);

      await service.disponiblesParaCoachee(ACTOR_USER_ID);

      expect(ejercicios.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activo: true, competenciaId: IsNull() },
        }),
      );
    });
  });

  describe('create', () => {
    it('rejects when the optional competencia does not exist', async () => {
      competencias.exists.mockResolvedValue(false);

      await expect(
        service.create({
          titulo: 'Mensaje difícil',
          consigna: 'Redacta un mensaje...',
          competenciaId: 'comp-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the ejercicio without a competencia', async () => {
      const ejercicio = await service.create({
        titulo: 'Mensaje difícil',
        consigna: 'Redacta un mensaje...',
      });

      expect(ejercicio.titulo).toBe('Mensaje difícil');
      expect(ejercicio.competenciaId).toBeNull();
    });

    it('converts fechaLimite to the end of that day in Chile time', async () => {
      const ejercicio = await service.create({
        titulo: 'Mensaje difícil',
        consigna: 'Redacta un mensaje...',
        fechaLimite: '2026-10-15',
      });

      expect(ejercicio.fechaLimite).toEqual(finDelDiaChileAUtc('2026-10-15'));
    });
  });

  describe('update', () => {
    it('sets and clears fechaLimite', async () => {
      ejercicios.findOne.mockResolvedValue({ id: EJERCICIO_ID });

      const conFecha = await service.update(EJERCICIO_ID, {
        fechaLimite: '2026-10-15',
      });
      expect(conFecha.fechaLimite).toEqual(finDelDiaChileAUtc('2026-10-15'));

      ejercicios.findOne.mockResolvedValue({
        id: EJERCICIO_ID,
        fechaLimite: finDelDiaChileAUtc('2026-10-15'),
      });
      const sinFecha = await service.update(EJERCICIO_ID, {
        fechaLimite: null,
      });
      expect(sinFecha.fechaLimite).toBeNull();
    });
  });

  describe('disponiblesParaCoachee — fechaLimite', () => {
    it('excludes an ejercicio whose fechaLimite already passed', async () => {
      planesDesarrollo.getByCoacheeId.mockResolvedValue({
        competenciaId: 'comp-1',
      });
      versiones.find.mockResolvedValue([]);
      ejercicios.find.mockResolvedValue([
        { id: 'vencido', fechaLimite: new Date('2020-01-01T00:00:00.000Z') },
        { id: 'vigente', fechaLimite: null },
      ]);

      const resultado = await service.disponiblesParaCoachee(ACTOR_USER_ID);

      expect(resultado.map((e) => e.id)).toEqual(['vigente']);
    });
  });

  describe('remove', () => {
    it('throws ConflictException when the ejercicio already has versiones', async () => {
      ejercicios.findOne.mockResolvedValue({ id: EJERCICIO_ID });
      versiones.exists.mockResolvedValue(true);

      await expect(service.remove(EJERCICIO_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(ejercicios.delete).not.toHaveBeenCalled();
    });

    it('deletes the ejercicio when it has no versiones', async () => {
      ejercicios.findOne.mockResolvedValue({ id: EJERCICIO_ID });
      versiones.exists.mockResolvedValue(false);

      await service.remove(EJERCICIO_ID);

      expect(ejercicios.delete).toHaveBeenCalledWith({ id: EJERCICIO_ID });
    });
  });

  describe('findOneParaCoachee', () => {
    it('throws NotFoundException when the ejercicio is not active', async () => {
      ejercicios.findOne.mockResolvedValue({ id: EJERCICIO_ID, activo: false });

      await expect(service.findOneParaCoachee(EJERCICIO_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('crearVersion', () => {
    it('rejects when the ejercicio is not active', async () => {
      ejercicios.findOne.mockResolvedValue({ id: EJERCICIO_ID, activo: false });

      await expect(
        service.crearVersion(ACTOR_USER_ID, EJERCICIO_ID, {
          sabe: 'que apruebe',
          siente: 'confianza',
          haga: 'firmar',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('numbers the version sequentially per coachee+ejercicio', async () => {
      ejercicios.findOne.mockResolvedValue({ id: EJERCICIO_ID, activo: true });
      versiones.count.mockResolvedValue(2);

      const version = await service.crearVersion(ACTOR_USER_ID, EJERCICIO_ID, {
        sabe: 'que apruebe',
        siente: 'confianza',
        haga: 'firmar',
      });

      expect(version.numeroVersion).toBe(3);
      expect(version.coacheeId).toBe(COACHEE_ID);
      expect(version.estado).toBe(EstadoVersionEjercicio.ENVIADA);
    });
  });

  describe('dejarFeedback', () => {
    it('throws NotFoundException when the version does not exist', async () => {
      versiones.findOne.mockResolvedValue(null);

      await expect(
        service.dejarFeedback('version-x', 'Buen trabajo'),
      ).rejects.toThrow(NotFoundException);
    });

    it('sets comentarioCoach and moves estado to con_feedback', async () => {
      versiones.findOne.mockResolvedValue({
        id: 'version-1',
        estado: EstadoVersionEjercicio.ENVIADA,
      });

      const version = await service.dejarFeedback('version-1', 'Buen trabajo');

      expect(version.comentarioCoach).toBe('Buen trabajo');
      expect(version.estado).toBe(EstadoVersionEjercicio.CON_FEEDBACK);
    });
  });
});
