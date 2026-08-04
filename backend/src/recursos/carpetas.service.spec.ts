import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CarpetasService } from './carpetas.service';
import { Carpeta } from './entities/carpeta.entity';
import { AsignacionCarpeta } from './entities/asignacion-carpeta.entity';
import { CoacheesService } from '../coachees/coachees.service';

type PartialCarpeta = Partial<Carpeta>;
type PartialAsignacion = Partial<AsignacionCarpeta>;

describe('CarpetasService', () => {
  let service: CarpetasService;
  let carpetasRepo: {
    findOne: jest.Mock<Promise<PartialCarpeta | null>, unknown[]>;
    find: jest.Mock<Promise<PartialCarpeta[]>, unknown[]>;
    create: jest.Mock<PartialCarpeta, [PartialCarpeta]>;
    save: jest.Mock<Promise<PartialCarpeta>, [PartialCarpeta]>;
    delete: jest.Mock<Promise<unknown>, unknown[]>;
    manager: { query: jest.Mock };
  };
  let asignacionesRepo: {
    findOne: jest.Mock<Promise<PartialAsignacion | null>, unknown[]>;
    find: jest.Mock<Promise<PartialAsignacion[]>, unknown[]>;
    create: jest.Mock<PartialAsignacion, [PartialAsignacion]>;
    save: jest.Mock<Promise<PartialAsignacion>, [PartialAsignacion]>;
    delete: jest.Mock<Promise<unknown>, unknown[]>;
  };
  let coachees: { exists: jest.Mock; findByUserId: jest.Mock };

  beforeEach(() => {
    carpetasRepo = {
      findOne: jest.fn<Promise<PartialCarpeta | null>, unknown[]>(),
      find: jest.fn<Promise<PartialCarpeta[]>, unknown[]>(),
      create: jest.fn((data: PartialCarpeta) => data),
      save: jest.fn((data: PartialCarpeta) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      delete: jest.fn<Promise<unknown>, unknown[]>(),
      manager: { query: jest.fn() },
    };
    asignacionesRepo = {
      findOne: jest.fn<Promise<PartialAsignacion | null>, unknown[]>(),
      find: jest.fn<Promise<PartialAsignacion[]>, unknown[]>(),
      create: jest.fn((data: PartialAsignacion) => data),
      save: jest.fn((data: PartialAsignacion) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      delete: jest.fn<Promise<unknown>, unknown[]>(),
    };
    coachees = { exists: jest.fn(), findByUserId: jest.fn() };

    service = new CarpetasService(
      carpetasRepo as unknown as Repository<Carpeta>,
      asignacionesRepo as unknown as Repository<AsignacionCarpeta>,
      coachees as unknown as CoacheesService,
    );
  });

  describe('create', () => {
    it('creates a root carpeta when no parentId is given', async () => {
      const carpeta = await service.create({ nombre: 'Liderazgo' });

      expect(carpetasRepo.findOne).not.toHaveBeenCalled();
      expect(carpeta.nombre).toBe('Liderazgo');
      expect(carpeta.parentId).toBeNull();
    });

    it('rejects when the parent carpeta does not exist', async () => {
      carpetasRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ nombre: 'Sub', parentId: 'missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a subcarpeta under an existing parent', async () => {
      carpetasRepo.findOne.mockResolvedValue({ id: 'padre' });

      const carpeta = await service.create({
        nombre: 'Sub',
        parentId: 'padre',
      });

      expect(carpeta.parentId).toBe('padre');
    });
  });

  describe('remove', () => {
    it('rejects when the carpeta has subcarpetas or recursos', async () => {
      carpetasRepo.findOne.mockResolvedValue({ id: 'c1' });
      carpetasRepo.manager.query.mockResolvedValue([{ total: 2 }]);

      await expect(service.remove('c1')).rejects.toThrow(ConflictException);
      expect(carpetasRepo.delete).not.toHaveBeenCalled();
    });

    it('deletes an empty carpeta', async () => {
      carpetasRepo.findOne.mockResolvedValue({ id: 'c1' });
      carpetasRepo.manager.query.mockResolvedValue([{ total: 0 }]);

      await service.remove('c1');

      expect(carpetasRepo.delete).toHaveBeenCalledWith('c1');
    });
  });

  describe('carpetaVisible', () => {
    it('is visible when the carpeta is public', async () => {
      carpetasRepo.findOne.mockResolvedValue({ id: 'c1', publica: true });

      await expect(service.carpetaVisible('c1', 'coachee-1')).resolves.toBe(
        true,
      );
      expect(asignacionesRepo.findOne).not.toHaveBeenCalled();
    });

    it('is visible when there is an active, non-expired grant', async () => {
      carpetasRepo.findOne.mockResolvedValue({ id: 'c1', publica: false });
      asignacionesRepo.findOne.mockResolvedValue({ id: 'a1', activa: true });

      await expect(service.carpetaVisible('c1', 'coachee-1')).resolves.toBe(
        true,
      );
    });

    it('is not visible when private with no active grant', async () => {
      carpetasRepo.findOne.mockResolvedValue({ id: 'c1', publica: false });
      asignacionesRepo.findOne.mockResolvedValue(null);

      await expect(service.carpetaVisible('c1', 'coachee-1')).resolves.toBe(
        false,
      );
    });
  });

  describe('carpetasVisiblesIds', () => {
    it('combines public carpetas with carpetas granted to the coachee', async () => {
      carpetasRepo.find.mockResolvedValue([{ id: 'pub-1' }, { id: 'pub-2' }]);
      asignacionesRepo.find.mockResolvedValue([{ carpetaId: 'priv-1' }]);

      const ids = await service.carpetasVisiblesIds('coachee-1');

      expect(ids).toEqual(new Set(['pub-1', 'pub-2', 'priv-1']));
    });
  });

  describe('asignar', () => {
    it('rejects when the coachee does not exist', async () => {
      carpetasRepo.findOne.mockResolvedValue({ id: 'c1' });
      coachees.exists.mockResolvedValue(false);

      await expect(
        service.asignar('c1', 'missing', true, undefined),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a grant with an expiration date', async () => {
      carpetasRepo.findOne.mockResolvedValue({ id: 'c1' });
      coachees.exists.mockResolvedValue(true);
      asignacionesRepo.findOne.mockResolvedValue(null);

      const asignacion = await service.asignar(
        'c1',
        'coachee-1',
        true,
        '2026-12-31T00:00:00.000Z',
      );

      expect(asignacion.activa).toBe(true);
      expect(asignacion.expiraEn).toEqual(new Date('2026-12-31T00:00:00.000Z'));
    });
  });

  describe('misCarpetas', () => {
    it('rejects when the actor has no coachee profile', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(service.misCarpetas('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns only visible carpetas', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      carpetasRepo.find
        .mockResolvedValueOnce([{ id: 'pub-1' }])
        .mockResolvedValueOnce([
          { id: 'pub-1', nombre: 'Pública' },
          { id: 'priv-1', nombre: 'Privada' },
        ]);
      asignacionesRepo.find.mockResolvedValue([]);

      const carpetas = await service.misCarpetas('user-1');

      expect(carpetas).toEqual([{ id: 'pub-1', nombre: 'Pública' }]);
    });
  });
});
