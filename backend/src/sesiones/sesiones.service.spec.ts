import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SesionesService } from './sesiones.service';
import { Sesion } from './entities/sesion.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { CoacheesService } from '../coachees/coachees.service';

type PartialSesion = Partial<Sesion>;
type PartialCiclo = Partial<CicloCoaching>;

describe('SesionesService', () => {
  let service: SesionesService;
  let repo: {
    findOne: jest.Mock<Promise<PartialSesion | null>, unknown[]>;
    find: jest.Mock<Promise<PartialSesion[]>, unknown[]>;
    create: jest.Mock<PartialSesion, [PartialSesion]>;
    save: jest.Mock<Promise<PartialSesion>, [PartialSesion]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let ciclosRepo: {
    findOne: jest.Mock<Promise<PartialCiclo | null>, unknown[]>;
  };
  let coachees: {
    exists: jest.Mock<Promise<boolean>, [string]>;
    findByUserId: jest.Mock<Promise<PartialSesion | null>, [string]>;
  };

  beforeEach(() => {
    repo = {
      findOne: jest.fn<Promise<PartialSesion | null>, unknown[]>(),
      // Por defecto sin sesiones vecinas — así el chequeo de conflicto de horario que corre
      // dentro de create()/update() no rompe los tests que no lo están probando a propósito.
      find: jest
        .fn<Promise<PartialSesion[]>, unknown[]>()
        .mockResolvedValue([]),
      create: jest.fn((data: PartialSesion) => data),
      save: jest.fn((data: PartialSesion) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    ciclosRepo = {
      findOne: jest
        .fn<Promise<PartialCiclo | null>, unknown[]>()
        .mockResolvedValue(null),
    };
    coachees = {
      exists: jest.fn<Promise<boolean>, [string]>(),
      findByUserId: jest.fn<Promise<PartialSesion | null>, [string]>(),
    };
    service = new SesionesService(
      repo as unknown as Repository<Sesion>,
      ciclosRepo as unknown as Repository<CicloCoaching>,
      coachees as unknown as CoacheesService,
    );
  });

  describe('create', () => {
    it('rejects when the coachee does not exist', async () => {
      coachees.exists.mockResolvedValue(false);

      await expect(
        service.create({
          coacheeId: 'missing',
          fechaHora: '2026-08-01T15:00:00.000Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a session for an existing coachee', async () => {
      coachees.exists.mockResolvedValue(true);

      const sesion = await service.create({
        coacheeId: 'coachee-1',
        fechaHora: '2026-08-01T15:00:00.000Z',
        linkVideollamada: 'https://meet.example.com/x',
      });

      expect(sesion.coacheeId).toBe('coachee-1');
      expect(sesion.linkVideollamada).toBe('https://meet.example.com/x');
      expect(sesion.cicloId).toBeNull();
    });

    it('links the session to the coachee open cycle, if any', async () => {
      coachees.exists.mockResolvedValue(true);
      ciclosRepo.findOne.mockResolvedValue({ id: 'ciclo-1' });

      const sesion = await service.create({
        coacheeId: 'coachee-1',
        fechaHora: '2026-08-01T15:00:00.000Z',
      });

      expect(sesion.cicloId).toBe('ciclo-1');
    });

    it('rejects when another session (any coachee) overlaps that time', async () => {
      coachees.exists.mockResolvedValue(true);
      repo.find.mockResolvedValue([
        { id: 'otra', fechaHora: new Date('2026-08-01T15:00:00.000Z') },
      ]);

      await expect(
        service.create({
          coacheeId: 'coachee-2',
          fechaHora: '2026-08-01T15:00:00.000Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('allows a session right after another one ends (no overlap)', async () => {
      coachees.exists.mockResolvedValue(true);
      repo.find.mockResolvedValue([
        { id: 'otra', fechaHora: new Date('2026-08-01T14:00:00.000Z') },
      ]);

      const sesion = await service.create({
        coacheeId: 'coachee-2',
        fechaHora: '2026-08-01T15:00:00.000Z',
      });

      expect(sesion.coacheeId).toBe('coachee-2');
    });
  });

  describe('findOneOwnedByCoachee', () => {
    it('throws NotFoundException when the session does not belong to that coachee', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.findOneOwnedByCoachee('s1', 'coachee-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the session when it belongs to that coachee', async () => {
      repo.findOne.mockResolvedValue({ id: 's1', coacheeId: 'coachee-1' });

      const sesion = await service.findOneOwnedByCoachee('s1', 'coachee-1');

      expect(sesion.id).toBe('s1');
    });
  });

  describe('findAllForCoachee', () => {
    it('strips notasPrivadas from every session', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      repo.find.mockResolvedValue([
        {
          id: 's1',
          coacheeId: 'coachee-1',
          notasPrivadas: 'secret notes',
        },
      ]);

      const result = await service.findAllForCoachee('user-1');

      expect(result[0]).not.toHaveProperty('notasPrivadas');
    });

    it('throws NotFoundException when the actor has no coachee profile', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(service.findAllForCoachee('user-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findProximaForCoachee', () => {
    it('returns null when there is no upcoming session', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      repo.findOne.mockResolvedValue(null);

      const result = await service.findProximaForCoachee('user-1');

      expect(result).toBeNull();
    });

    it('strips notasPrivadas from the upcoming session', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      repo.findOne.mockResolvedValue({
        id: 's1',
        coacheeId: 'coachee-1',
        notasPrivadas: 'secret notes',
      });

      const result = await service.findProximaForCoachee('user-1');

      expect(result).not.toHaveProperty('notasPrivadas');
    });
  });

  describe('findProximaForCoacheeId', () => {
    it('queries directly by coacheeId, without resolving an actor', async () => {
      repo.findOne.mockResolvedValue({
        id: 's1',
        coacheeId: 'coachee-1',
        notasPrivadas: 'secret notes',
      });

      const result = await service.findProximaForCoacheeId('coachee-1');

      expect(coachees.findByUserId).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty('notasPrivadas');
    });

    it('returns null when there is no upcoming session', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.findProximaForCoacheeId('coachee-1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('applies only the given fields', async () => {
      repo.findOne.mockResolvedValue({
        id: 's1',
        coacheeId: 'coachee-1',
        linkVideollamada: 'old-link',
      });

      const updated = await service.update('s1', {
        linkVideollamada: 'new-link',
      });

      expect(updated.linkVideollamada).toBe('new-link');
    });

    it('rejects moving fechaHora onto another session', async () => {
      repo.findOne.mockResolvedValue({ id: 's1', coacheeId: 'coachee-1' });
      repo.find.mockResolvedValue([
        { id: 'otra', fechaHora: new Date('2026-08-01T15:00:00.000Z') },
      ]);

      await expect(
        service.update('s1', { fechaHora: '2026-08-01T15:00:00.000Z' }),
      ).rejects.toThrow(ConflictException);
    });

    it('excludes the session being updated from its own conflict check', async () => {
      repo.findOne.mockResolvedValue({ id: 's1', coacheeId: 'coachee-1' });
      repo.find.mockResolvedValue([
        { id: 's1', fechaHora: new Date('2026-08-01T15:00:00.000Z') },
      ]);

      const updated = await service.update('s1', {
        fechaHora: '2026-08-01T15:00:00.000Z',
      });

      expect(updated.fechaHora.toISOString()).toBe('2026-08-01T15:00:00.000Z');
    });
  });

  describe('findTodasConCoachee', () => {
    it('returns every session with the coachee relation loaded', async () => {
      repo.find.mockResolvedValue([
        { id: 's1', coachee: { id: 'coachee-1', nombre: 'Ana' } },
      ]);

      const result = await service.findTodasConCoachee();

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: { coachee: true } }),
      );
      expect(result[0].coachee?.nombre).toBe('Ana');
    });
  });

  describe('findEnRangoConCoachee', () => {
    it('queries by fechaHora range with the coachee relation loaded', async () => {
      repo.find.mockResolvedValue([
        { id: 's1', coachee: { id: 'coachee-1', nombre: 'Ana' } },
      ]);
      const desde = new Date('2026-08-01T00:00:00.000Z');
      const hasta = new Date('2026-08-08T00:00:00.000Z');

      const result = await service.findEnRangoConCoachee(desde, hasta);

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: { coachee: { empresa: true } } }),
      );
      expect(result[0].coachee?.nombre).toBe('Ana');
    });
  });

  describe('confirmar', () => {
    it('marca la sesión del coachee actor como confirmada', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      repo.findOne.mockResolvedValue({
        id: 's1',
        coacheeId: 'coachee-1',
        confirmada: false,
      });

      const result = await service.confirmar('s1', 'user-1');

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ confirmada: true }),
      );
      expect(result.confirmada).toBe(true);
    });

    it('throws NotFoundException when the actor has no coachee profile', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(service.confirmar('s1', 'user-x')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the session does not belong to that coachee', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      repo.findOne.mockResolvedValue(null);

      await expect(service.confirmar('s1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when nothing was deleted', async () => {
      repo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('resolves when the session was deleted', async () => {
      repo.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove('s1')).resolves.toBeUndefined();
    });
  });
});
