import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PerfilCoachService } from './perfil-coach.service';
import { PerfilCoach } from './entities/perfil-coach.entity';
import { CertificacionCoach } from './entities/certificacion-coach.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../auth/enums/role.enum';

type PartialPerfil = Partial<PerfilCoach>;
type PartialCertificacion = Partial<CertificacionCoach>;
type PartialUser = Partial<User>;

describe('PerfilCoachService', () => {
  let service: PerfilCoachService;
  let perfiles: {
    findOne: jest.Mock<Promise<PartialPerfil | null>, unknown[]>;
    create: jest.Mock<PartialPerfil, [PartialPerfil]>;
    save: jest.Mock<Promise<PartialPerfil>, [PartialPerfil]>;
  };
  let certificaciones: {
    findOne: jest.Mock<Promise<PartialCertificacion | null>, unknown[]>;
    create: jest.Mock<PartialCertificacion, [PartialCertificacion]>;
    save: jest.Mock<Promise<PartialCertificacion>, [PartialCertificacion]>;
    remove: jest.Mock<Promise<PartialCertificacion>, [PartialCertificacion]>;
  };
  let users: {
    findOne: jest.Mock<Promise<PartialUser | null>, unknown[]>;
  };

  beforeEach(() => {
    perfiles = {
      findOne: jest.fn<Promise<PartialPerfil | null>, unknown[]>(),
      create: jest.fn((data: PartialPerfil) => data),
      save: jest.fn((data: PartialPerfil) =>
        Promise.resolve({ id: 'perfil-generated-id', ...data }),
      ),
    };
    certificaciones = {
      findOne: jest.fn<Promise<PartialCertificacion | null>, unknown[]>(),
      create: jest.fn((data: PartialCertificacion) => data),
      save: jest.fn((data: PartialCertificacion) =>
        Promise.resolve({ id: 'cert-generated-id', ...data }),
      ),
      remove: jest.fn((data: PartialCertificacion) => Promise.resolve(data)),
    };
    users = { findOne: jest.fn<Promise<PartialUser | null>, unknown[]>() };
    service = new PerfilCoachService(
      perfiles as unknown as Repository<PerfilCoach>,
      certificaciones as unknown as Repository<CertificacionCoach>,
      users as unknown as Repository<User>,
    );
  });

  describe('obtenerOCrearPropio', () => {
    it('returns the existing perfil when one already exists', async () => {
      perfiles.findOne.mockResolvedValue({
        id: 'p1',
        coachUserId: 'u1',
        nombre: 'Fernando',
      });

      const perfil = await service.obtenerOCrearPropio('u1');

      expect(perfil.nombre).toBe('Fernando');
      expect(perfiles.save).not.toHaveBeenCalled();
    });

    it('creates an empty perfil on first access', async () => {
      perfiles.findOne.mockResolvedValue(null);

      const perfil = await service.obtenerOCrearPropio('u1');

      expect(perfil).toEqual(
        expect.objectContaining({ coachUserId: 'u1', nombre: '' }),
      );
    });
  });

  describe('obtenerDelCoach', () => {
    it('resolves the perfil of the único usuario Role.COACH', async () => {
      users.findOne.mockResolvedValue({ id: 'coach-1', role: Role.COACH });
      perfiles.findOne.mockResolvedValue({ id: 'p1', coachUserId: 'coach-1' });

      const perfil = await service.obtenerDelCoach();

      expect(users.findOne).toHaveBeenCalledWith({
        where: { role: Role.COACH },
      });
      expect(perfil.coachUserId).toBe('coach-1');
    });

    it('throws NotFoundException when there is no coach user yet', async () => {
      users.findOne.mockResolvedValue(null);

      await expect(service.obtenerDelCoach()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('actualizar', () => {
    it('merges the given fields onto the existing perfil, keeping the rest', async () => {
      perfiles.findOne.mockResolvedValue({
        id: 'p1',
        coachUserId: 'u1',
        nombre: 'Fernando',
        bio: 'Bio vieja',
      });

      const actualizado = await service.actualizar('u1', { bio: 'Bio nueva' });

      expect(actualizado.nombre).toBe('Fernando');
      expect(actualizado.bio).toBe('Bio nueva');
    });
  });

  describe('actualizarFoto', () => {
    it('sets fotoPath/fotoNombre from the uploaded file', async () => {
      perfiles.findOne.mockResolvedValue({
        id: 'p1',
        coachUserId: 'u1',
        fotoPath: null,
      });

      const actualizado = await service.actualizarFoto('u1', {
        filename: 'foto-abc.jpg',
        originalname: 'yo.jpg',
      } as Express.Multer.File);

      expect(actualizado.fotoPath).toBe('foto-abc.jpg');
      expect(actualizado.fotoNombre).toBe('yo.jpg');
    });

    it('replaces a previous foto without failing even if the old file is missing on disk', async () => {
      perfiles.findOne.mockResolvedValue({
        id: 'p1',
        coachUserId: 'u1',
        fotoPath: 'foto-old.jpg',
      });

      const actualizado = await service.actualizarFoto('u1', {
        filename: 'foto-new.jpg',
        originalname: 'nueva.jpg',
      } as Express.Multer.File);

      expect(actualizado.fotoPath).toBe('foto-new.jpg');
    });
  });

  describe('agregarCertificacion / eliminarCertificacion', () => {
    it('creates a certificación linked to the perfil', async () => {
      perfiles.findOne.mockResolvedValue({ id: 'p1', coachUserId: 'u1' });

      const certificacion = await service.agregarCertificacion('u1', {
        nombre: 'ICF ACC',
        entidadEmisora: 'International Coach Federation',
      });

      expect(certificacion).toEqual(
        expect.objectContaining({
          perfilCoachId: 'p1',
          nombre: 'ICF ACC',
          entidadEmisora: 'International Coach Federation',
        }),
      );
    });

    it('rejects deleting a certificación that does not belong to the perfil', async () => {
      perfiles.findOne.mockResolvedValue({ id: 'p1', coachUserId: 'u1' });
      certificaciones.findOne.mockResolvedValue(null);

      await expect(
        service.eliminarCertificacion('u1', 'cert-ajena'),
      ).rejects.toThrow(NotFoundException);
      expect(certificaciones.remove).not.toHaveBeenCalled();
    });

    it('deletes the certificación when it belongs to the perfil', async () => {
      perfiles.findOne.mockResolvedValue({ id: 'p1', coachUserId: 'u1' });
      certificaciones.findOne.mockResolvedValue({
        id: 'cert-1',
        perfilCoachId: 'p1',
      });

      await service.eliminarCertificacion('u1', 'cert-1');

      expect(certificaciones.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'cert-1' }),
      );
    });
  });
});
