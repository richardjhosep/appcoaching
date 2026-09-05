import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmpresasService } from './empresas.service';
import { Empresa } from './entities/empresa.entity';
import { GestionRenovacion } from './entities/gestion-renovacion.entity';

type PartialEmpresa = Partial<Empresa>;
type PartialGestion = Partial<GestionRenovacion>;

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
  let gestionesRepo: {
    find: jest.Mock<Promise<PartialGestion[]>, unknown[]>;
    create: jest.Mock<PartialGestion, [PartialGestion]>;
    save: jest.Mock<Promise<PartialGestion>, [PartialGestion]>;
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
    gestionesRepo = {
      find: jest
        .fn<Promise<PartialGestion[]>, unknown[]>()
        .mockResolvedValue([]),
      create: jest.fn((data: PartialGestion) => data),
      save: jest.fn((data: PartialGestion) =>
        Promise.resolve({ id: 'gestion-generated-id', ...data }),
      ),
    };
    service = new EmpresasService(
      repo as unknown as Repository<Empresa>,
      gestionesRepo as unknown as Repository<GestionRenovacion>,
    );
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

  describe('crearGestion', () => {
    it('crea una gestión de renovación para una empresa existente', async () => {
      repo.findOne.mockResolvedValue({ id: 'e1', nombre: 'Andes Minerals' });

      const gestion = await service.crearGestion('e1', {
        nota: 'Llamada, esperando respuesta',
        proximoSeguimiento: '2026-10-01',
      });

      expect(gestion).toEqual(
        expect.objectContaining({
          empresaId: 'e1',
          nota: 'Llamada, esperando respuesta',
          proximoSeguimiento: '2026-10-01',
        }),
      );
    });

    it('rechaza la gestión si la empresa no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.crearGestion('missing', { nota: 'x' }),
      ).rejects.toThrow(NotFoundException);
      expect(gestionesRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('listGestionDeEmpresa', () => {
    it('lista la bitácora de una empresa, la más reciente primero', async () => {
      repo.findOne.mockResolvedValue({ id: 'e1', nombre: 'Andes Minerals' });
      gestionesRepo.find.mockResolvedValue([
        { id: 'g2', empresaId: 'e1', nota: 'Más reciente' },
        { id: 'g1', empresaId: 'e1', nota: 'Más antigua' },
      ]);

      const lista = await service.listGestionDeEmpresa('e1');

      expect(lista).toHaveLength(2);
      expect(gestionesRepo.find).toHaveBeenCalledWith({
        where: { empresaId: 'e1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('ultimaGestionPorEmpresa', () => {
    it('devuelve solo la más reciente por empresa (primera vista gana)', async () => {
      gestionesRepo.find.mockResolvedValue([
        { id: 'g2', empresaId: 'e1', nota: 'Más reciente' },
        { id: 'g1', empresaId: 'e1', nota: 'Más antigua' },
        { id: 'g3', empresaId: 'e2', nota: 'Única de e2' },
      ]);

      const mapa = await service.ultimaGestionPorEmpresa();

      expect(mapa.get('e1')?.id).toBe('g2');
      expect(mapa.get('e2')?.id).toBe('g3');
      expect(mapa.size).toBe(2);
    });
  });
});
