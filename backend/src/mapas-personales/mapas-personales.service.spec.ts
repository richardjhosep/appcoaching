import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MapasPersonalesService } from './mapas-personales.service';
import { MapaPersonal } from './entities/mapa-personal.entity';
import { NodoMapaPersonal } from './entities/nodo-mapa-personal.entity';
import { CoacheesService } from '../coachees/coachees.service';

type PartialMapa = Partial<MapaPersonal>;
type PartialNodo = Partial<NodoMapaPersonal>;

describe('MapasPersonalesService', () => {
  let service: MapasPersonalesService;
  let mapasRepo: {
    findOne: jest.Mock<Promise<PartialMapa | null>, unknown[]>;
    find: jest.Mock<Promise<PartialMapa[]>, unknown[]>;
    create: jest.Mock<PartialMapa, [PartialMapa]>;
    save: jest.Mock<Promise<PartialMapa>, [PartialMapa]>;
    delete: jest.Mock;
  };
  let nodosRepo: {
    findOne: jest.Mock<Promise<PartialNodo | null>, unknown[]>;
    find: jest.Mock<Promise<PartialNodo[]>, unknown[]>;
    create: jest.Mock<PartialNodo, [PartialNodo]>;
    save: jest.Mock<Promise<PartialNodo>, [PartialNodo]>;
    delete: jest.Mock;
    count: jest.Mock<Promise<number>, unknown[]>;
    exists: jest.Mock<Promise<boolean>, unknown[]>;
  };
  let coachees: { findByUserId: jest.Mock };

  beforeEach(() => {
    mapasRepo = {
      findOne: jest.fn<Promise<PartialMapa | null>, unknown[]>(),
      find: jest.fn<Promise<PartialMapa[]>, unknown[]>().mockResolvedValue([]),
      create: jest.fn((data: PartialMapa) => data),
      save: jest.fn((data: PartialMapa) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    nodosRepo = {
      findOne: jest.fn<Promise<PartialNodo | null>, unknown[]>(),
      find: jest.fn<Promise<PartialNodo[]>, unknown[]>().mockResolvedValue([]),
      create: jest.fn((data: PartialNodo) => data),
      save: jest.fn((data: PartialNodo) =>
        Promise.resolve({ id: 'nodo-generated-id', ...data }),
      ),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn<Promise<number>, unknown[]>().mockResolvedValue(0),
      exists: jest.fn<Promise<boolean>, unknown[]>().mockResolvedValue(true),
    };
    coachees = { findByUserId: jest.fn() };
    service = new MapasPersonalesService(
      mapasRepo as unknown as Repository<MapaPersonal>,
      nodosRepo as unknown as Repository<NodoMapaPersonal>,
      coachees as unknown as CoacheesService,
    );
  });

  describe('create', () => {
    it('resuelve el coacheeId desde el actor y crea el mapa', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });

      const mapa = await service.create('user-1', { titulo: 'Liderazgo' });

      expect(mapa).toEqual(
        expect.objectContaining({
          coacheeId: 'coachee-1',
          titulo: 'Liderazgo',
        }),
      );
    });

    it('lanza NotFoundException si el actor no tiene perfil de coachee', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(
        service.create('user-x', { titulo: 'Liderazgo' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneConNodos — ownership', () => {
    it('devuelve el mapa con sus nodos cuando es del propio coachee', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      mapasRepo.findOne.mockResolvedValue({
        id: 'm1',
        coacheeId: 'coachee-1',
        titulo: 'Foco',
      });
      nodosRepo.find.mockResolvedValue([
        { id: 'n1', mapaId: 'm1', label: 'Tema' },
      ]);

      const mapa = await service.findOneConNodos('user-1', 'm1');

      expect(mapa.nodos).toHaveLength(1);
    });

    it('rechaza con NotFoundException un mapa que pertenece a otro coachee', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      // El repo real filtra por coacheeId en el where — simulamos que no lo encuentra.
      mapasRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOneConNodos('user-1', 'm-de-otro-coachee'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update — ownership', () => {
    it('rechaza actualizar un mapa que no es del actor', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      mapasRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'm-ajeno', { titulo: 'x' }),
      ).rejects.toThrow(NotFoundException);
      expect(mapasRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove — ownership', () => {
    it('rechaza eliminar un mapa que no es del actor', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      mapasRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('user-1', 'm-ajeno')).rejects.toThrow(
        NotFoundException,
      );
      expect(mapasRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('addNodo', () => {
    it('agrega un nodo raíz calculando el siguiente orden', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      mapasRepo.findOne.mockResolvedValue({ id: 'm1', coacheeId: 'coachee-1' });
      nodosRepo.count.mockResolvedValue(2);

      const nodo = await service.addNodo('user-1', 'm1', { label: 'Concepto' });

      expect(nodo).toEqual(
        expect.objectContaining({ mapaId: 'm1', label: 'Concepto', orden: 3 }),
      );
    });

    it('rechaza agregar un nodo a un mapa que no es del actor', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      mapasRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addNodo('user-1', 'm-ajeno', { label: 'x' }),
      ).rejects.toThrow(NotFoundException);
      expect(nodosRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateNodo — ownership', () => {
    it('actualiza un nodo cuyo mapa es del propio coachee', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      nodosRepo.findOne.mockResolvedValue({
        id: 'n1',
        mapaId: 'm1',
        label: 'Viejo',
        mapa: { id: 'm1', coacheeId: 'coachee-1' },
      });

      const nodo = await service.updateNodo('user-1', 'n1', { label: 'Nuevo' });

      expect(nodo.label).toBe('Nuevo');
    });

    it('rechaza actualizar un nodo cuyo mapa es de otro coachee', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      nodosRepo.findOne.mockResolvedValue({
        id: 'n1',
        mapaId: 'm1',
        mapa: { id: 'm1', coacheeId: 'coachee-otro' },
      });

      await expect(
        service.updateNodo('user-1', 'n1', { label: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
      expect(nodosRepo.save).not.toHaveBeenCalled();
    });

    it('rechaza que un nodo sea su propio padre', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      nodosRepo.findOne.mockResolvedValue({
        id: 'n1',
        mapaId: 'm1',
        mapa: { id: 'm1', coacheeId: 'coachee-1' },
      });

      await expect(
        service.updateNodo('user-1', 'n1', { parentId: 'n1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeNodo — ownership', () => {
    it('rechaza eliminar un nodo cuyo mapa es de otro coachee', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      nodosRepo.findOne.mockResolvedValue({
        id: 'n1',
        mapaId: 'm1',
        mapa: { id: 'm1', coacheeId: 'coachee-otro' },
      });

      await expect(service.removeNodo('user-1', 'n1')).rejects.toThrow(
        NotFoundException,
      );
      expect(nodosRepo.delete).not.toHaveBeenCalled();
    });
  });
});
