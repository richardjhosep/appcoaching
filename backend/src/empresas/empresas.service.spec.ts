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
});
