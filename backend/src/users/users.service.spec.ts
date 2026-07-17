import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../auth/enums/role.enum';
import { EmpresasService } from '../empresas/empresas.service';

type PartialUser = Partial<User>;

describe('UsersService', () => {
  let service: UsersService;
  let repo: {
    findOne: jest.Mock<Promise<PartialUser | null>, unknown[]>;
    exists: jest.Mock;
    create: jest.Mock<PartialUser, [PartialUser]>;
    save: jest.Mock<Promise<PartialUser>, [PartialUser]>;
    createQueryBuilder: jest.Mock;
  };
  let config: { get: jest.Mock };
  let empresas: { exists: jest.Mock<Promise<boolean>, [string]> };

  beforeEach(() => {
    repo = {
      findOne: jest.fn<Promise<PartialUser | null>, unknown[]>(),
      exists: jest.fn(),
      create: jest.fn((data: PartialUser) => data),
      save: jest.fn((data: PartialUser) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      createQueryBuilder: jest.fn(),
    };
    config = { get: jest.fn().mockReturnValue(4) };
    empresas = { exists: jest.fn<Promise<boolean>, [string]>() };
    service = new UsersService(
      repo as unknown as Repository<User>,
      config as unknown as ConfigService,
      empresas as unknown as EmpresasService,
    );
  });

  describe('createUser', () => {
    it('creates a user with a random temporary password when none is given', async () => {
      repo.findOne.mockResolvedValue(null);

      const { user, temporaryPassword } = await service.createUser(
        'new@example.com',
        Role.COACHEE,
      );

      expect(temporaryPassword).toEqual(expect.any(String));
      expect(temporaryPassword!.length).toBeGreaterThan(0);
      expect(user.mustChangePassword).toBe(true);
      expect(await bcrypt.compare(temporaryPassword!, user.passwordHash)).toBe(
        true,
      );
    });

    it('does not return a temporary password when an explicit one is provided (seed case)', async () => {
      repo.findOne.mockResolvedValue(null);

      const { user, temporaryPassword } = await service.createUser(
        'coach@example.com',
        Role.COACH,
        {
          password: 'chosen-password',
          mustChangePassword: false,
        },
      );

      expect(temporaryPassword).toBeNull();
      expect(user.mustChangePassword).toBe(false);
      expect(await bcrypt.compare('chosen-password', user.passwordHash)).toBe(
        true,
      );
    });

    it('rejects when a user with that email already exists', async () => {
      repo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createUser('taken@example.com', Role.COACHEE),
      ).rejects.toThrow(ConflictException);
    });

    it('requires empresaId for the EMPRESA role', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.createUser('empresa@example.com', Role.EMPRESA),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an empresaId that does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      empresas.exists.mockResolvedValue(false);

      await expect(
        service.createUser('empresa@example.com', Role.EMPRESA, {
          empresaId: 'missing-empresa-id',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('links the user to the given empresa when role is EMPRESA', async () => {
      repo.findOne.mockResolvedValue(null);
      empresas.exists.mockResolvedValue(true);

      const { user } = await service.createUser(
        'empresa@example.com',
        Role.EMPRESA,
        {
          empresaId: 'empresa-1',
        },
      );

      expect(user.empresaId).toBe('empresa-1');
    });

    it('ignores any empresaId given for non-EMPRESA roles', async () => {
      repo.findOne.mockResolvedValue(null);

      const { user } = await service.createUser(
        'coachee@example.com',
        Role.COACHEE,
        {
          empresaId: 'should-be-ignored',
        },
      );

      expect(user.empresaId).toBeNull();
      expect(empresas.exists).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('updates the password hash when the current password is correct', async () => {
      const existingHash = await bcrypt.hash('old-password', 4);
      repo.findOne.mockResolvedValue({
        id: 'user-1',
        passwordHash: existingHash,
        mustChangePassword: true,
      });

      await service.changePassword('user-1', 'old-password', 'new-password');

      const saved = repo.save.mock.calls[0][0];
      expect(saved.mustChangePassword).toBe(false);
      expect(await bcrypt.compare('new-password', saved.passwordHash)).toBe(
        true,
      );
    });

    it('rejects when the current password is wrong', async () => {
      const existingHash = await bcrypt.hash('old-password', 4);
      repo.findOne.mockResolvedValue({
        id: 'user-1',
        passwordHash: existingHash,
      });

      await expect(
        service.changePassword('user-1', 'wrong', 'new-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when the user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.changePassword('missing', 'a', 'b')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('seedCoachIfMissing', () => {
    function mockInsertQueryBuilder(identifiers: unknown[]) {
      const qb: Record<string, jest.Mock> = {};
      qb.insert = jest.fn(() => qb);
      qb.into = jest.fn(() => qb);
      qb.values = jest.fn(() => qb);
      qb.orIgnore = jest.fn(() => qb);
      qb.execute = jest.fn(() => Promise.resolve({ identifiers }));
      return qb;
    }

    it('returns true and hashes the password when the insert wins the race', async () => {
      const qb = mockInsertQueryBuilder([{ id: 'new-id' }]);
      repo.createQueryBuilder.mockReturnValue(qb);

      const created = await service.seedCoachIfMissing(
        'coach@example.com',
        'CoachPassword123',
      );

      expect(created).toBe(true);
      const valuesCalls = qb.values.mock.calls as [PartialUser][];
      const values = valuesCalls[0][0];
      expect(values.email).toBe('coach@example.com');
      expect(values.role).toBe(Role.COACH);
      expect(
        await bcrypt.compare('CoachPassword123', values.passwordHash!),
      ).toBe(true);
    });

    it('returns false when another instance already won the race (ON CONFLICT DO NOTHING)', async () => {
      const qb = mockInsertQueryBuilder([]);
      repo.createQueryBuilder.mockReturnValue(qb);

      const created = await service.seedCoachIfMissing(
        'coach@example.com',
        'CoachPassword123',
      );

      expect(created).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('sets a new temporary password and forces a password change', async () => {
      repo.findOne.mockResolvedValue({
        id: 'user-1',
        passwordHash: 'old-hash',
      });

      const temporaryPassword = await service.resetPassword('user-1');

      const saved = repo.save.mock.calls[0][0];
      expect(saved.mustChangePassword).toBe(true);
      expect(await bcrypt.compare(temporaryPassword, saved.passwordHash)).toBe(
        true,
      );
    });
  });
});
