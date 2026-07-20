import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmpresasService } from './empresas.service';
import { Empresa } from './entities/empresa.entity';

type PartialEmpresa = Partial<Empresa>;

describe('EmpresasService', () => {
  let service: EmpresasService;
  let repo: {
    findOne: jest.Mock<Promise<PartialEmpresa | null>, unknown[]>;
    find: jest.Mock<Promise<PartialEmpresa[]>, unknown[]>;
    exists: jest.Mock<Promise<boolean>, unknown[]>;
    create: jest.Mock<PartialEmpresa, [PartialEmpresa]>;
    save: jest.Mock<Promise<PartialEmpresa>, [PartialEmpresa]>;
    remove: jest.Mock<Promise<PartialEmpresa>, [PartialEmpresa]>;
    manager: { query: jest.Mock };
  };

  beforeEach(() => {
    repo = {
      findOne: jest.fn<Promise<PartialEmpresa | null>, unknown[]>(),
      find: jest.fn<Promise<PartialEmpresa[]>, unknown[]>(),
      exists: jest.fn<Promise<boolean>, unknown[]>(),
      create: jest.fn((data: PartialEmpresa) => data),
      save: jest.fn((data: PartialEmpresa) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      remove: jest.fn((data: PartialEmpresa) => Promise.resolve(data)),
      manager: { query: jest.fn().mockResolvedValue([{ total: 0 }]) },
    };
    service = new EmpresasService(repo as unknown as Repository<Empresa>);
  });

  describe('create', () => {
    it('creates an empresa when the name is not taken', async () => {
      repo.findOne.mockResolvedValue(null);

      const empresa = await service.create({
        nombre: 'Andes Minerals',
        tarifaHora: 45000,
      });

      expect(empresa.nombre).toBe('Andes Minerals');
      expect(empresa.tarifaHora).toBe(45000);
    });

    it('rejects a duplicate name', async () => {
      repo.findOne.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({ nombre: 'Andes Minerals', tarifaHora: 45000 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the empresa does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('merges the given fields onto the existing empresa', async () => {
      repo.findOne.mockResolvedValue({
        id: 'e1',
        nombre: 'Old Name',
        tarifaHora: 1000,
        isActive: true,
      });

      const updated = await service.update('e1', { tarifaHora: 2000 });

      expect(updated.nombre).toBe('Old Name');
      expect(updated.tarifaHora).toBe(2000);
    });
  });

  describe('remove', () => {
    it('deletes the empresa when it has no coachees or users', async () => {
      repo.findOne.mockResolvedValue({ id: 'e1', nombre: 'Andes Minerals' });
      repo.manager.query.mockResolvedValue([{ total: 0 }]);

      await service.remove('e1');

      expect(repo.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'e1' }),
      );
    });

    it('rejects when the empresa still has coachees or users associated', async () => {
      repo.findOne.mockResolvedValue({ id: 'e1', nombre: 'Andes Minerals' });
      repo.manager.query.mockResolvedValue([{ total: 2 }]);

      await expect(service.remove('e1')).rejects.toThrow(ConflictException);
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });
});
