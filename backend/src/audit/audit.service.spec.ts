import { Repository } from 'typeorm';
import { ACCIONES_COACHING, AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Role } from '../auth/enums/role.enum';

interface FindArgs {
  where: Record<string, unknown>;
  order: unknown;
  take: number;
}

describe('AuditService', () => {
  let service: AuditService;
  let logsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock<Promise<AuditLog[]>, [FindArgs]>;
  };
  let usersRepo: { findOne: jest.Mock };
  let coacheesRepo: { findOne: jest.Mock };
  let empresasRepo: { findOne: jest.Mock };

  beforeEach(() => {
    logsRepo = {
      create: jest.fn((data: Partial<AuditLog>) => data),
      save: jest.fn((data: Partial<AuditLog>) =>
        Promise.resolve({ id: 'log-1', ...data }),
      ),
      find: jest.fn<Promise<AuditLog[]>, [FindArgs]>().mockResolvedValue([]),
    };
    usersRepo = { findOne: jest.fn() };
    coacheesRepo = { findOne: jest.fn() };
    empresasRepo = { findOne: jest.fn() };

    service = new AuditService(
      logsRepo as unknown as Repository<AuditLog>,
      usersRepo as unknown as Repository<User>,
      coacheesRepo as unknown as Repository<Coachee>,
      empresasRepo as unknown as Repository<Empresa>,
    );
  });

  describe('record — actorLabel', () => {
    it('uses the real nombre for a coachee actor', async () => {
      usersRepo.findOne.mockResolvedValue({
        id: 'u1',
        role: Role.COACHEE,
        email: 'coachee@test.com',
      });
      coacheesRepo.findOne.mockResolvedValue({ nombre: 'Rodrigo Peña' });

      await service.record('LOGIN_SUCCESS', { userId: 'u1' });

      expect(logsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ actorLabel: 'Coachee Rodrigo Peña' }),
      );
    });

    it('falls back to email when the coachee actor has no linked profile', async () => {
      usersRepo.findOne.mockResolvedValue({
        id: 'u1',
        role: Role.COACHEE,
        email: 'coachee@test.com',
      });
      coacheesRepo.findOne.mockResolvedValue(null);

      await service.record('LOGIN_SUCCESS', { userId: 'u1' });

      expect(logsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ actorLabel: 'Coachee (coachee@test.com)' }),
      );
    });

    it('labels a coach actor by email', async () => {
      usersRepo.findOne.mockResolvedValue({
        id: 'u1',
        role: Role.COACH,
        email: 'coach@test.com',
      });

      await service.record('LOGIN_SUCCESS', { userId: 'u1' });

      expect(logsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ actorLabel: 'Coach (coach@test.com)' }),
      );
    });

    it('leaves actorLabel null when there is no userId', async () => {
      await service.record('LOGIN_FAILED', { metadata: { email: 'x@x.com' } });

      expect(logsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ actorLabel: null }),
      );
      expect(usersRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('record — targetLabel', () => {
    it('uses the explicit targetLabel passed by the caller without resolving anything', async () => {
      await service.record('EMPRESA_ELIMINADA', {
        targetType: 'Empresa',
        targetId: 'e1',
        targetLabel: 'Andes Minerals',
      });

      expect(logsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ targetLabel: 'Andes Minerals' }),
      );
      expect(empresasRepo.findOne).not.toHaveBeenCalled();
    });

    it('resolves the Coachee nombre automatically when no explicit label is given', async () => {
      coacheesRepo.findOne.mockResolvedValue({ nombre: 'Rodrigo Peña' });

      await service.record('PLAN_APROBADO', {
        targetType: 'Coachee',
        targetId: 'c1',
      });

      expect(coacheesRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
      expect(logsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ targetLabel: 'Rodrigo Peña' }),
      );
    });

    it('returns null when the target no longer exists and no explicit label was given', async () => {
      coacheesRepo.findOne.mockResolvedValue(null);

      await service.record('PLAN_APROBADO', {
        targetType: 'Coachee',
        targetId: 'gone',
      });

      expect(logsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ targetLabel: null }),
      );
    });

    it('returns null when there is no targetType/targetId at all', async () => {
      await service.record('LOGIN_SUCCESS', { userId: undefined });

      expect(logsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ targetLabel: null }),
      );
    });
  });

  describe('find', () => {
    it('orders by createdAt DESC and caps at 100', async () => {
      await service.find({});

      expect(logsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'DESC' }, take: 100 }),
      );
    });

    it('defaults to only coaching-relevant actions, filtering out app/security noise', async () => {
      await service.find({});

      expect(logsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: expect.objectContaining({
              _value: expect.arrayContaining([
                'PLAN_APROBADO',
                'CICLO_CERRADO',
                'DOCUMENTO_LEGAL_ACTUALIZADO',
              ]) as unknown,
            }) as unknown,
          }) as unknown,
        }),
      );
      expect(ACCIONES_COACHING).not.toContain('LOGIN_SUCCESS');
    });

    it('does not filter by action when scope is "todo"', async () => {
      await service.find({ scope: 'todo' });

      expect(logsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('an explicit action filter wins over the coaching whitelist', async () => {
      await service.find({ action: 'LOGIN_SUCCESS' });

      expect(logsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { action: 'LOGIN_SUCCESS' } }),
      );
    });

    it('filters by a desde/hasta date range, combined with targetId', async () => {
      await service.find({
        targetId: 'c1',
        desde: '2026-08-01',
        hasta: '2026-08-05',
      });

      const { where } = logsRepo.find.mock.calls[0][0];
      const createdAt = where.createdAt as { _value: [Date, Date] };
      expect(where.targetId).toBe('c1');
      expect(createdAt._value[0].toISOString()).toBe(
        new Date('2026-08-01T00:00:00').toISOString(),
      );
      expect(createdAt._value[1].toISOString()).toBe(
        new Date('2026-08-05T23:59:59.999').toISOString(),
      );
    });

    it('defaults an open-ended "hasta" to right now when only "desde" is given', async () => {
      await service.find({ desde: '2026-08-01' });

      const { where } = logsRepo.find.mock.calls[0][0];
      const createdAt = where.createdAt as { _value: [Date, Date] };
      expect(createdAt._value[0].toISOString()).toBe(
        new Date('2026-08-01T00:00:00').toISOString(),
      );
      expect(createdAt._value[1].getFullYear()).toBeGreaterThan(2000);
    });

    it('defaults an open-ended "desde" to the epoch when only "hasta" is given', async () => {
      await service.find({ hasta: '2026-08-01' });

      const { where } = logsRepo.find.mock.calls[0][0];
      const createdAt = where.createdAt as { _value: [Date, Date] };
      expect(createdAt._value[0].getTime()).toBe(0);
      expect(createdAt._value[1].toISOString()).toBe(
        new Date('2026-08-01T23:59:59.999').toISOString(),
      );
    });
  });
});
