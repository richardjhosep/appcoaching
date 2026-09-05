import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { QuizService } from './quiz.service';
import { Quiz } from './entities/quiz.entity';
import { PreguntaQuiz } from './entities/pregunta-quiz.entity';
import { IntentoQuiz } from './entities/intento-quiz.entity';
import { Recurso } from '../recursos/entities/recurso.entity';
import { CoacheesService } from '../coachees/coachees.service';
import { CompetenciasService } from '../competencias/competencias.service';
import { PlanesDesarrolloService } from '../planes-desarrollo/planes-desarrollo.service';
import { finDelDiaChileAUtc } from '../common/chile-time.util';

type PartialQuiz = Partial<Quiz>;
type PartialPregunta = Partial<PreguntaQuiz>;
type PartialIntento = Partial<IntentoQuiz>;

describe('QuizService', () => {
  let service: QuizService;
  let quizzes: {
    findOne: jest.Mock<Promise<PartialQuiz | null>, unknown[]>;
    find: jest.Mock<Promise<PartialQuiz[]>, unknown[]>;
    create: jest.Mock<PartialQuiz, [PartialQuiz]>;
    save: jest.Mock<Promise<PartialQuiz>, [PartialQuiz]>;
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
  let recursos: { exists: jest.Mock<Promise<boolean>, unknown[]> };
  let coachees: {
    findByUserId: jest.Mock<Promise<{ id: string } | null>, [string]>;
  };
  let competencias: { exists: jest.Mock<Promise<boolean>, [string]> };
  let planesDesarrollo: { getByCoacheeId: jest.Mock };

  const ACTOR_USER_ID = 'user-1';
  const COACHEE_ID = 'coachee-1';
  const QUIZ_ID = 'quiz-1';

  beforeEach(() => {
    quizzes = {
      findOne: jest.fn<Promise<PartialQuiz | null>, unknown[]>(),
      find: jest.fn<Promise<PartialQuiz[]>, unknown[]>(),
      create: jest.fn((data: PartialQuiz) => data),
      save: jest.fn((data: PartialQuiz) =>
        Promise.resolve({ id: QUIZ_ID, ...data }),
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
    recursos = { exists: jest.fn<Promise<boolean>, unknown[]>() };
    coachees = {
      findByUserId: jest.fn<Promise<{ id: string } | null>, [string]>(),
    };
    competencias = { exists: jest.fn<Promise<boolean>, [string]>() };
    planesDesarrollo = { getByCoacheeId: jest.fn() };

    coachees.findByUserId.mockResolvedValue({ id: COACHEE_ID });
    intentos.exists.mockResolvedValue(false);
    intentos.find.mockResolvedValue([]);

    service = new QuizService(
      quizzes as unknown as Repository<Quiz>,
      preguntas as unknown as Repository<PreguntaQuiz>,
      intentos as unknown as Repository<IntentoQuiz>,
      recursos as unknown as Repository<Recurso>,
      coachees as unknown as CoacheesService,
      competencias as unknown as CompetenciasService,
      planesDesarrollo as unknown as PlanesDesarrolloService,
    );
  });

  describe('disponiblesParaCoachee', () => {
    it('returns nothing when the coachee has no plan (no competencia to filter by)', async () => {
      planesDesarrollo.getByCoacheeId.mockRejectedValue(
        new NotFoundException(),
      );

      const resultado = await service.disponiblesParaCoachee(ACTOR_USER_ID);

      expect(resultado).toEqual([]);
      expect(quizzes.find).not.toHaveBeenCalled();
    });

    it("only queries quizzes matching the competencia of the coachee's plan", async () => {
      planesDesarrollo.getByCoacheeId.mockResolvedValue({
        competenciaId: 'comp-1',
      });
      quizzes.find.mockResolvedValue([]);

      await service.disponiblesParaCoachee(ACTOR_USER_ID);

      expect(quizzes.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activo: true, competenciaId: 'comp-1' },
        }),
      );
    });

    it('excludes a quiz whose fechaLimite already passed', async () => {
      planesDesarrollo.getByCoacheeId.mockResolvedValue({
        competenciaId: 'comp-1',
      });
      quizzes.find.mockResolvedValue([
        { id: 'q-vencido', fechaLimite: new Date('2020-01-01T00:00:00.000Z') },
        { id: 'q-vigente', fechaLimite: new Date('2999-01-01T00:00:00.000Z') },
        { id: 'q-sin-limite', fechaLimite: null },
      ]);

      const resultado = await service.disponiblesParaCoachee(ACTOR_USER_ID);

      expect(resultado.map((q) => q.id)).toEqual(['q-vigente', 'q-sin-limite']);
    });
  });

  describe('addPregunta', () => {
    it('rejects when respuestaCorrecta is out of range', async () => {
      quizzes.findOne.mockResolvedValue({ id: QUIZ_ID });

      await expect(
        service.addPregunta(QUIZ_ID, {
          enunciado: '¿Cuál es la capital de Chile?',
          opciones: ['Santiago', 'Valparaíso'],
          respuestaCorrecta: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('saves the pregunta and includes respuestaCorrecta in the plain result', async () => {
      quizzes.findOne.mockResolvedValue({ id: QUIZ_ID });
      preguntas.count.mockResolvedValue(0);

      const pregunta = await service.addPregunta(QUIZ_ID, {
        enunciado: '¿Cuál es la capital de Chile?',
        opciones: ['Santiago', 'Valparaíso'],
        respuestaCorrecta: 0,
      });

      expect(pregunta.respuestaCorrecta).toBe(0);
      expect(pregunta.orden).toBe(1);
    });
  });

  describe('findOneParaCoachee', () => {
    it('never includes respuestaCorrecta in the returned shape', async () => {
      quizzes.findOne.mockResolvedValue({
        id: QUIZ_ID,
        titulo: 'Comunicación',
        competenciaId: 'comp-1',
        recursoId: null,
        activo: true,
      });
      preguntas.find.mockResolvedValue([
        {
          id: 'pregunta-1',
          enunciado: '¿Pregunta?',
          opciones: ['A', 'B'],
          respuestaCorrecta: 1,
          orden: 1,
        },
      ]);

      const quiz = await service.findOneParaCoachee(QUIZ_ID);

      expect(quiz.preguntas[0]).toEqual({
        id: 'pregunta-1',
        enunciado: '¿Pregunta?',
        opciones: ['A', 'B'],
        orden: 1,
      });
      expect('respuestaCorrecta' in quiz.preguntas[0]).toBe(false);
    });

    it('throws NotFoundException when the quiz is not active', async () => {
      quizzes.findOne.mockResolvedValue({ id: QUIZ_ID, activo: false });

      await expect(service.findOneParaCoachee(QUIZ_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('responder', () => {
    beforeEach(() => {
      quizzes.findOne.mockResolvedValue({ id: QUIZ_ID, activo: true });
      preguntas.find.mockResolvedValue([
        { id: 'p1', respuestaCorrecta: 0, orden: 1 },
        { id: 'p2', respuestaCorrecta: 1, orden: 2 },
      ]);
    });

    it('rejects when respuestas.length does not match the number of preguntas', async () => {
      await expect(
        service.responder(ACTOR_USER_ID, QUIZ_ID, [0]),
      ).rejects.toThrow(BadRequestException);
    });

    it('computes puntaje comparing against the real respuestaCorrecta', async () => {
      const resultado = await service.responder(ACTOR_USER_ID, QUIZ_ID, [0, 0]);

      expect(resultado.puntaje).toBe(1);
      expect(resultado.totalPreguntas).toBe(2);
      expect(resultado.detalle).toEqual([
        { preguntaId: 'p1', correcta: true, respuestaCorrecta: 0 },
        { preguntaId: 'p2', correcta: false, respuestaCorrecta: 1 },
      ]);
      expect(intentos.save).toHaveBeenCalledWith(
        expect.objectContaining({ puntaje: 1, totalPreguntas: 2 }),
      );
    });
  });

  describe('remove', () => {
    it('throws ConflictException when the quiz already has intentos', async () => {
      quizzes.findOne.mockResolvedValue({ id: QUIZ_ID });
      intentos.exists.mockResolvedValue(true);

      await expect(service.remove(QUIZ_ID)).rejects.toThrow(ConflictException);
      expect(quizzes.delete).not.toHaveBeenCalled();
    });

    it('deletes the quiz when it has no intentos', async () => {
      quizzes.findOne.mockResolvedValue({ id: QUIZ_ID });
      intentos.exists.mockResolvedValue(false);

      await service.remove(QUIZ_ID);

      expect(quizzes.delete).toHaveBeenCalledWith({ id: QUIZ_ID });
    });
  });

  describe('create', () => {
    it('rejects when the competencia does not exist', async () => {
      competencias.exists.mockResolvedValue(false);

      await expect(
        service.create({ titulo: 'Quiz', competenciaId: 'comp-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects when the optional recurso does not exist', async () => {
      competencias.exists.mockResolvedValue(true);
      recursos.exists.mockResolvedValue(false);

      await expect(
        service.create({
          titulo: 'Quiz',
          competenciaId: 'comp-1',
          recursoId: 'recurso-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('converts fechaLimite to the end of that day in Chile time', async () => {
      competencias.exists.mockResolvedValue(true);

      const quiz = await service.create({
        titulo: 'Quiz',
        competenciaId: 'comp-1',
        fechaLimite: '2026-10-15',
      });

      expect(quiz.fechaLimite).toEqual(finDelDiaChileAUtc('2026-10-15'));
    });

    it('leaves fechaLimite null when not given', async () => {
      competencias.exists.mockResolvedValue(true);

      const quiz = await service.create({
        titulo: 'Quiz',
        competenciaId: 'comp-1',
      });

      expect(quiz.fechaLimite).toBeNull();
    });
  });

  describe('update', () => {
    it('sets fechaLimite when a date is given', async () => {
      quizzes.findOne.mockResolvedValue({ id: QUIZ_ID, titulo: 'Quiz' });

      const quiz = await service.update(QUIZ_ID, { fechaLimite: '2026-10-15' });

      expect(quiz.fechaLimite).toEqual(finDelDiaChileAUtc('2026-10-15'));
    });

    it('clears fechaLimite when explicitly sent as null', async () => {
      quizzes.findOne.mockResolvedValue({
        id: QUIZ_ID,
        titulo: 'Quiz',
        fechaLimite: new Date('2026-10-15T23:59:00.000Z'),
      });

      const quiz = await service.update(QUIZ_ID, { fechaLimite: null });

      expect(quiz.fechaLimite).toBeNull();
    });

    it('leaves fechaLimite untouched when not sent', async () => {
      const original = new Date('2026-10-15T23:59:00.000Z');
      quizzes.findOne.mockResolvedValue({
        id: QUIZ_ID,
        titulo: 'Quiz',
        fechaLimite: original,
      });

      const quiz = await service.update(QUIZ_ID, { titulo: 'Nuevo título' });

      expect(quiz.fechaLimite).toBe(original);
    });
  });
});
