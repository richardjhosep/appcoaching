import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CoacheesService } from './coachees.service';
import { Coachee } from './entities/coachee.entity';
import { EmpresasService } from '../empresas/empresas.service';
import { UsersService } from '../users/users.service';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

type PartialCoachee = Partial<Coachee>;

describe('CoacheesService', () => {
  let service: CoacheesService;
  let repo: {
    findOne: jest.Mock<Promise<PartialCoachee | null>, unknown[]>;
    find: jest.Mock<Promise<PartialCoachee[]>, unknown[]>;
    create: jest.Mock<PartialCoachee, [PartialCoachee]>;
    save: jest.Mock<Promise<PartialCoachee>, [PartialCoachee]>;
  };
  let empresas: { exists: jest.Mock<Promise<boolean>, [string]> };
  let users: { createUser: jest.Mock };

  const buildActor = (
    role: Role,
    empresaId: string | null = null,
  ): AuthenticatedUser => ({
    id: 'actor-1',
    email: 'actor@example.com',
    role,
    empresaId,
  });

  beforeEach(() => {
    repo = {
      findOne: jest.fn<Promise<PartialCoachee | null>, unknown[]>(),
      find: jest.fn<Promise<PartialCoachee[]>, unknown[]>(),
      create: jest.fn((data: PartialCoachee) => data),
      save: jest.fn((data: PartialCoachee) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
    };
    empresas = { exists: jest.fn<Promise<boolean>, [string]>() };
    users = {
      createUser: jest.fn().mockResolvedValue({
        user: { id: 'user-1' },
        temporaryPassword: 'temp-pass',
      }),
    };
    service = new CoacheesService(
      repo as unknown as Repository<Coachee>,
      empresas as unknown as EmpresasService,
      users as unknown as UsersService,
    );
  });

  describe('create', () => {
    it('creates an independent coachee (no empresa) with a login account', async () => {
      const { coachee, temporaryPassword } = await service.create({
        nombre: 'Ignacio Prieto',
        email: 'ignacio@example.com',
      });

      expect(users.createUser).toHaveBeenCalledWith(
        'ignacio@example.com',
        Role.COACHEE,
      );
      expect(coachee.userId).toBe('user-1');
      expect(coachee.empresaId).toBeNull();
      expect(temporaryPassword).toBe('temp-pass');
    });

    it('creates a coachee linked to an existing empresa', async () => {
      empresas.exists.mockResolvedValue(true);

      const { coachee } = await service.create({
        nombre: 'María Fernanda Soto',
        email: 'maria@example.com',
        empresaId: 'empresa-1',
      });

      expect(coachee.empresaId).toBe('empresa-1');
    });

    it('rejects when empresaId does not exist', async () => {
      empresas.exists.mockResolvedValue(false);

      await expect(
        service.create({
          nombre: 'X',
          email: 'x@example.com',
          empresaId: 'missing',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(users.createUser).not.toHaveBeenCalled();
    });
  });

  describe('findAllForActor', () => {
    it('returns every coachee for a Coach', async () => {
      repo.find.mockResolvedValue([]);

      await service.findAllForActor(buildActor(Role.COACH));

      expect(repo.find).toHaveBeenCalledWith({
        relations: { empresa: true, user: true },
      });
    });

    it('scopes to the empresa for an Empresa actor', async () => {
      repo.find.mockResolvedValue([]);

      await service.findAllForActor(buildActor(Role.EMPRESA, 'empresa-1'));

      expect(repo.find).toHaveBeenCalledWith({
        where: { empresaId: 'empresa-1' },
        relations: { empresa: true, user: true },
      });
    });

    it('returns an empty list for an Empresa actor without empresaId', async () => {
      const result = await service.findAllForActor(
        buildActor(Role.EMPRESA, null),
      );

      expect(result).toEqual([]);
      expect(repo.find).not.toHaveBeenCalled();
    });
  });

  describe('findOneForActor', () => {
    it('throws NotFoundException when the coachee does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.findOneForActor('missing', buildActor(Role.COACH)),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows an Empresa actor to view a coachee from their own empresa', async () => {
      repo.findOne.mockResolvedValue({ id: 'c1', empresaId: 'empresa-1' });

      const coachee = await service.findOneForActor(
        'c1',
        buildActor(Role.EMPRESA, 'empresa-1'),
      );

      expect(coachee.id).toBe('c1');
    });

    it('rejects an Empresa actor viewing a coachee from another empresa', async () => {
      repo.findOne.mockResolvedValue({ id: 'c1', empresaId: 'empresa-2' });

      await expect(
        service.findOneForActor('c1', buildActor(Role.EMPRESA, 'empresa-1')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateOwnContact', () => {
    it('updates the contact fields for the coachee owning that userId', async () => {
      repo.findOne.mockResolvedValue({ id: 'c1', userId: 'user-1' });

      const updated = await service.updateOwnContact('user-1', {
        telefono: '+56911112222',
        emailContacto: 'personal@example.com',
      });

      expect(updated.telefono).toBe('+56911112222');
      expect(updated.emailContacto).toBe('personal@example.com');
    });

    it('throws NotFoundException when no coachee profile exists for that user', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.updateOwnContact('user-x', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setConsentimiento', () => {
    it('sets consentimientoFecha when marking as informado', async () => {
      repo.findOne.mockResolvedValue({
        id: 'c1',
        consentimientoInformado: false,
      });

      const updated = await service.setConsentimiento('c1', true);

      expect(updated.consentimientoInformado).toBe(true);
      expect(updated.consentimientoFecha).toBeInstanceOf(Date);
    });

    it('clears consentimientoFecha when unmarking', async () => {
      repo.findOne.mockResolvedValue({
        id: 'c1',
        consentimientoInformado: true,
        consentimientoFecha: new Date('2026-01-01'),
      });

      const updated = await service.setConsentimiento('c1', false);

      expect(updated.consentimientoInformado).toBe(false);
      expect(updated.consentimientoFecha).toBeNull();
    });

    it('throws NotFoundException when the coachee does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.setConsentimiento('missing', true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
