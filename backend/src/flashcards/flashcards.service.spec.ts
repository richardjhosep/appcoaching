import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  FlashcardsService,
  calcularProximaRevision,
} from './flashcards.service';
import { Flashcard } from './entities/flashcard.entity';
import { RepasoFlashcard } from './entities/repaso-flashcard.entity';
import { Recurso } from '../recursos/entities/recurso.entity';
import { CoacheesService } from '../coachees/coachees.service';
import { CompetenciasService } from '../competencias/competencias.service';

type PartialFlashcard = Partial<Flashcard>;
type PartialRepaso = Partial<RepasoFlashcard>;

describe('calcularProximaRevision', () => {
  const desde = new Date('2026-08-16T12:00:00.000Z');

  it('olvidado: +1 día', () => {
    expect(calcularProximaRevision('olvidado', desde)).toBe('2026-08-17');
  });

  it('dificil: +3 días', () => {
    expect(calcularProximaRevision('dificil', desde)).toBe('2026-08-19');
  });

  it('facil: +7 días', () => {
    expect(calcularProximaRevision('facil', desde)).toBe('2026-08-23');
  });
});

describe('FlashcardsService', () => {
  let service: FlashcardsService;
  let flashcards: {
    findOne: jest.Mock<Promise<PartialFlashcard | null>, unknown[]>;
    find: jest.Mock<Promise<PartialFlashcard[]>, unknown[]>;
    create: jest.Mock<PartialFlashcard, [PartialFlashcard]>;
    save: jest.Mock<Promise<PartialFlashcard>, [PartialFlashcard]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let repasos: {
    findOne: jest.Mock<Promise<PartialRepaso | null>, unknown[]>;
    find: jest.Mock<Promise<PartialRepaso[]>, unknown[]>;
    exists: jest.Mock<Promise<boolean>, unknown[]>;
    create: jest.Mock<PartialRepaso, [PartialRepaso]>;
    save: jest.Mock<Promise<PartialRepaso>, [PartialRepaso]>;
  };
  let recursos: { exists: jest.Mock<Promise<boolean>, unknown[]> };
  let coachees: {
    findByUserId: jest.Mock<Promise<{ id: string } | null>, [string]>;
  };
  let competencias: { exists: jest.Mock<Promise<boolean>, [string]> };

  const ACTOR_USER_ID = 'user-1';
  const COACHEE_ID = 'coachee-1';
  const FLASHCARD_ID = 'flashcard-1';

  beforeEach(() => {
    flashcards = {
      findOne: jest.fn<Promise<PartialFlashcard | null>, unknown[]>(),
      find: jest.fn<Promise<PartialFlashcard[]>, unknown[]>(),
      create: jest.fn((data: PartialFlashcard) => data),
      save: jest.fn((data: PartialFlashcard) =>
        Promise.resolve({ id: FLASHCARD_ID, ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    repasos = {
      findOne: jest.fn<Promise<PartialRepaso | null>, unknown[]>(),
      find: jest.fn<Promise<PartialRepaso[]>, unknown[]>(),
      exists: jest.fn<Promise<boolean>, unknown[]>(),
      create: jest.fn((data: PartialRepaso) => data),
      save: jest.fn((data: PartialRepaso) =>
        Promise.resolve({ id: 'repaso-1', ...data }),
      ),
    };
    recursos = { exists: jest.fn<Promise<boolean>, unknown[]>() };
    coachees = {
      findByUserId: jest.fn<Promise<{ id: string } | null>, [string]>(),
    };
    competencias = { exists: jest.fn<Promise<boolean>, [string]>() };

    coachees.findByUserId.mockResolvedValue({ id: COACHEE_ID });
    repasos.exists.mockResolvedValue(false);
    repasos.findOne.mockResolvedValue(null);

    service = new FlashcardsService(
      flashcards as unknown as Repository<Flashcard>,
      repasos as unknown as Repository<RepasoFlashcard>,
      recursos as unknown as Repository<Recurso>,
      coachees as unknown as CoacheesService,
      competencias as unknown as CompetenciasService,
    );
  });

  describe('disponiblesParaCoachee', () => {
    it('marks debeRepasar=true when the coachee never studied the card', async () => {
      flashcards.find.mockResolvedValue([{ id: FLASHCARD_ID, activo: true }]);
      repasos.findOne.mockResolvedValue(null);

      const [resultado] = await service.disponiblesParaCoachee(ACTOR_USER_ID);

      expect(resultado.debeRepasar).toBe(true);
      expect(resultado.proximaRevision).toBeNull();
    });

    it('marks debeRepasar=false when the next review date is in the future', async () => {
      flashcards.find.mockResolvedValue([{ id: FLASHCARD_ID, activo: true }]);
      const manana = new Date();
      manana.setUTCDate(manana.getUTCDate() + 5);
      repasos.findOne.mockResolvedValue({
        proximaRevision: manana.toISOString().slice(0, 10),
      });

      const [resultado] = await service.disponiblesParaCoachee(ACTOR_USER_ID);

      expect(resultado.debeRepasar).toBe(false);
    });

    it('marks debeRepasar=true when the next review date already passed', async () => {
      flashcards.find.mockResolvedValue([{ id: FLASHCARD_ID, activo: true }]);
      repasos.findOne.mockResolvedValue({ proximaRevision: '2000-01-01' });

      const [resultado] = await service.disponiblesParaCoachee(ACTOR_USER_ID);

      expect(resultado.debeRepasar).toBe(true);
    });
  });

  describe('registrarRepaso', () => {
    it('saves a repaso with the computed proximaRevision', async () => {
      flashcards.findOne.mockResolvedValue({ id: FLASHCARD_ID });

      await service.registrarRepaso(ACTOR_USER_ID, FLASHCARD_ID, 'facil');

      expect(repasos.save).toHaveBeenCalledWith(
        expect.objectContaining({
          flashcardId: FLASHCARD_ID,
          coacheeId: COACHEE_ID,
          resultado: 'facil',
        }),
      );
    });

    it('throws NotFoundException when the flashcard does not exist', async () => {
      flashcards.findOne.mockResolvedValue(null);

      await expect(
        service.registrarRepaso(ACTOR_USER_ID, FLASHCARD_ID, 'facil'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('throws ConflictException when the flashcard already has repasos', async () => {
      flashcards.findOne.mockResolvedValue({ id: FLASHCARD_ID });
      repasos.exists.mockResolvedValue(true);

      await expect(service.remove(FLASHCARD_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(flashcards.delete).not.toHaveBeenCalled();
    });

    it('deletes the flashcard when it has no repasos', async () => {
      flashcards.findOne.mockResolvedValue({ id: FLASHCARD_ID });
      repasos.exists.mockResolvedValue(false);

      await service.remove(FLASHCARD_ID);

      expect(flashcards.delete).toHaveBeenCalledWith({ id: FLASHCARD_ID });
    });
  });

  describe('create', () => {
    it('rejects when the competencia does not exist', async () => {
      competencias.exists.mockResolvedValue(false);

      await expect(
        service.create({
          anverso: 'Pregunta',
          reverso: 'Respuesta',
          competenciaId: 'comp-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
