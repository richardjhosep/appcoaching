import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { IsNull, Repository } from 'typeorm';
import { TestEstiloService } from './test-estilo.service';
import { TestEstilo } from './entities/test-estilo.entity';
import { PreguntaEstilo } from './entities/pregunta-estilo.entity';
import { IntentoEstilo } from './entities/intento-estilo.entity';
import { CoacheesService } from '../coachees/coachees.service';
import { CompetenciasService } from '../competencias/competencias.service';
import { PlanesDesarrolloService } from '../planes-desarrollo/planes-desarrollo.service';
import { finDelDiaChileAUtc } from '../common/chile-time.util';

type PartialTest = Partial<TestEstilo>;
type PartialPregunta = Partial<PreguntaEstilo>;
type PartialIntento = Partial<IntentoEstilo>;

describe('TestEstiloService', () => {
  let service: TestEstiloService;
  let tests: {
    findOne: jest.Mock<Promise<PartialTest | null>, unknown[]>;
    find: jest.Mock<Promise<PartialTest[]>, unknown[]>;
    create: jest.Mock<PartialTest, [PartialTest]>;
    save: jest.Mock<Promise<PartialTest>, [PartialTest]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let preguntas: {
    find: jest.Mock<Promise<PartialPregunta[]>, unknown[]>;
    count: jest.Mock<Promise<number>, unknown[]>;
    findOne: jest.Mock<Promise<PartialPregunta | null>, unknown[]>;
    create: jest.Mock<PartialPregunta, [PartialPregunta]>;
    save: jest.Mock<Promise<PartialPregunta>, [PartialPregunta]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let intentos: {
    find: jest.Mock<Promise<PartialIntento[]>, unknown[]>;
    exists: jest.Mock<Promise<boolean>, unknown[]>;
    create: jest.Mock<PartialIntento, [PartialIntento]>;
    save: jest.Mock<Promise<PartialIntento>, [PartialIntento]>;
  };
  let coachees: { findByUserId: jest.Mock };
  let competencias: { exists: jest.Mock };
  let planesDesarrollo: { getByCoacheeId: jest.Mock };

  const ACTOR_USER_ID = 'user-1';
  const COACHEE_ID = 'coachee-1';
  const TEST_ID = 'test-1';

  beforeEach(() => {
    tests = {
      findOne: jest.fn<Promise<PartialTest | null>, unknown[]>(),
      find: jest.fn<Promise<PartialTest[]>, unknown[]>(),
      create: jest.fn((data: PartialTest) => data),
      save: jest.fn((data: PartialTest) =>
        Promise.resolve({ id: TEST_ID, ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    preguntas = {
      find: jest.fn<Promise<PartialPregunta[]>, unknown[]>(),
      count: jest.fn<Promise<number>, unknown[]>(),
      findOne: jest.fn<Promise<PartialPregunta | null>, unknown[]>(),
      create: jest.fn((data: PartialPregunta) => data),
      save: jest.fn((data: PartialPregunta) =>
        Promise.resolve({ id: 'pregunta-1', ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    intentos = {
      find: jest.fn<Promise<PartialIntento[]>, unknown[]>(),
      exists: jest.fn<Promise<boolean>, unknown[]>(),
      create: jest.fn((data: PartialIntento) => data),
      save: jest.fn((data: PartialIntento) =>
        Promise.resolve({ id: 'intento-1', ...data }),
      ),
    };
    coachees = { findByUserId: jest.fn() };
    competencias = { exists: jest.fn() };
    planesDesarrollo = { getByCoacheeId: jest.fn() };

    coachees.findByUserId.mockResolvedValue({ id: COACHEE_ID });
    intentos.exists.mockResolvedValue(false);

    service = new TestEstiloService(
      tests as unknown as Repository<TestEstilo>,
      preguntas as unknown as Repository<PreguntaEstilo>,
      intentos as unknown as Repository<IntentoEstilo>,
      coachees as unknown as CoacheesService,
      competencias as unknown as CompetenciasService,
      planesDesarrollo as unknown as PlanesDesarrolloService,
    );
  });

  describe('create', () => {
    it('rejects when the optional competencia does not exist', async () => {
      competencias.exists.mockResolvedValue(false);

      await expect(
        service.create({
          titulo: 'Manejo de conflicto',
          competenciaId: 'comp-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the test without a competencia', async () => {
      const test = await service.create({ titulo: 'Manejo de conflicto' });

      expect(test.titulo).toBe('Manejo de conflicto');
      expect(test.competenciaId).toBeNull();
    });

    it('converts fechaLimite to the end of that day in Chile time', async () => {
      const test = await service.create({
        titulo: 'Manejo de conflicto',
        fechaLimite: '2026-10-15',
      });

      expect(test.fechaLimite).toEqual(finDelDiaChileAUtc('2026-10-15'));
    });
  });

  describe('update', () => {
    it('sets and clears fechaLimite', async () => {
      tests.findOne.mockResolvedValue({ id: TEST_ID });

      const conFecha = await service.update(TEST_ID, {
        fechaLimite: '2026-10-15',
      });
      expect(conFecha.fechaLimite).toEqual(finDelDiaChileAUtc('2026-10-15'));

      tests.findOne.mockResolvedValue({
        id: TEST_ID,
        fechaLimite: finDelDiaChileAUtc('2026-10-15'),
      });
      const sinFecha = await service.update(TEST_ID, { fechaLimite: null });
      expect(sinFecha.fechaLimite).toBeNull();
    });
  });

  describe('findOneParaCoachee', () => {
    it('never includes categoriaA/categoriaB in the returned shape', async () => {
      tests.findOne.mockResolvedValue({ id: TEST_ID, activo: true });
      preguntas.find.mockResolvedValue([
        {
          id: 'p1',
          opcionA: 'Insisto en mi posición',
          categoriaA: 'Competir',
          opcionB: 'Cedo para mantener la relación',
          categoriaB: 'Acomodar',
          orden: 1,
        },
      ]);

      const test = await service.findOneParaCoachee(TEST_ID);

      expect(test.preguntas[0]).toEqual({
        id: 'p1',
        opcionA: 'Insisto en mi posición',
        opcionB: 'Cedo para mantener la relación',
        orden: 1,
      });
      expect('categoriaA' in test.preguntas[0]).toBe(false);
      expect('categoriaB' in test.preguntas[0]).toBe(false);
    });

    it('throws NotFoundException when the test is not active', async () => {
      tests.findOne.mockResolvedValue({ id: TEST_ID, activo: false });

      await expect(service.findOneParaCoachee(TEST_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('responder', () => {
    beforeEach(() => {
      tests.findOne.mockResolvedValue({ id: TEST_ID, activo: true });
      preguntas.find.mockResolvedValue([
        { id: 'p1', categoriaA: 'Competir', categoriaB: 'Acomodar', orden: 1 },
        { id: 'p2', categoriaA: 'Competir', categoriaB: 'Colaborar', orden: 2 },
        { id: 'p3', categoriaA: 'Colaborar', categoriaB: 'Acomodar', orden: 3 },
      ]);
    });

    it('rejects when respuestas.length does not match the number of preguntas', async () => {
      await expect(
        service.responder(ACTOR_USER_ID, TEST_ID, ['A']),
      ).rejects.toThrow(BadRequestException);
    });

    it('tallies the resultado per categoría and picks the dominant one', async () => {
      const intento = await service.responder(ACTOR_USER_ID, TEST_ID, [
        'A',
        'A',
        'A',
      ]);

      expect(intento.resultado).toEqual({ Competir: 2, Colaborar: 1 });
      expect(intento.categoriaDominante).toBe('Competir');
    });

    it('joins tied categorías with " / "', async () => {
      // p1 A -> Competir, p2 B -> Colaborar, p3 B -> Acomodar: 1-1-1, triple empate.
      const intento = await service.responder(ACTOR_USER_ID, TEST_ID, [
        'A',
        'B',
        'B',
      ]);

      expect(intento.resultado).toEqual({
        Competir: 1,
        Colaborar: 1,
        Acomodar: 1,
      });
      expect(intento.categoriaDominante).toBe(
        'Competir / Colaborar / Acomodar',
      );
    });
  });

  describe('remove', () => {
    it('throws ConflictException when the test already has intentos', async () => {
      tests.findOne.mockResolvedValue({ id: TEST_ID });
      intentos.exists.mockResolvedValue(true);

      await expect(service.remove(TEST_ID)).rejects.toThrow(ConflictException);
      expect(tests.delete).not.toHaveBeenCalled();
    });

    it('deletes the test when it has no intentos', async () => {
      tests.findOne.mockResolvedValue({ id: TEST_ID });

      await service.remove(TEST_ID);

      expect(tests.delete).toHaveBeenCalledWith({ id: TEST_ID });
    });
  });

  describe('disponiblesParaCoachee', () => {
    it('shows only competencia-matched + universal tests when the coachee has a plan', async () => {
      planesDesarrollo.getByCoacheeId.mockResolvedValue({
        competenciaId: 'comp-1',
      });
      tests.find.mockResolvedValue([]);

      await service.disponiblesParaCoachee(ACTOR_USER_ID);

      expect(tests.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { activo: true, competenciaId: 'comp-1' },
            { activo: true, competenciaId: IsNull() },
          ],
        }),
      );
    });
  });

  describe('disponiblesParaCoachee — fechaLimite', () => {
    it('excludes a test whose fechaLimite already passed', async () => {
      planesDesarrollo.getByCoacheeId.mockResolvedValue({
        competenciaId: 'comp-1',
      });
      preguntas.count.mockResolvedValue(0);
      intentos.find.mockResolvedValue([]);
      tests.find.mockResolvedValue([
        { id: 'vencido', fechaLimite: new Date('2020-01-01T00:00:00.000Z') },
        { id: 'vigente', fechaLimite: null },
      ]);

      const resultado = await service.disponiblesParaCoachee(ACTOR_USER_ID);

      expect(resultado.map((t) => t.id)).toEqual(['vigente']);
    });
  });
});
