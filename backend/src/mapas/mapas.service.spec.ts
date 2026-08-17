import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MapasService } from './mapas.service';
import { MapaMental } from './entities/mapa-mental.entity';
import { NodoMapa } from './entities/nodo-mapa.entity';
import { Recurso } from '../recursos/entities/recurso.entity';
import { CompetenciasService } from '../competencias/competencias.service';

type PartialMapa = Partial<MapaMental>;
type PartialNodo = Partial<NodoMapa>;

describe('MapasService', () => {
  let service: MapasService;
  let mapas: {
    findOne: jest.Mock<Promise<PartialMapa | null>, unknown[]>;
    find: jest.Mock<Promise<PartialMapa[]>, unknown[]>;
    create: jest.Mock<PartialMapa, [PartialMapa]>;
    save: jest.Mock<Promise<PartialMapa>, [PartialMapa]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let nodos: {
    findOne: jest.Mock<Promise<PartialNodo | null>, unknown[]>;
    find: jest.Mock<Promise<PartialNodo[]>, unknown[]>;
    count: jest.Mock<Promise<number>, unknown[]>;
    exists: jest.Mock<Promise<boolean>, unknown[]>;
    create: jest.Mock<PartialNodo, [PartialNodo]>;
    save: jest.Mock<Promise<PartialNodo>, [PartialNodo]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let recursos: { exists: jest.Mock<Promise<boolean>, unknown[]> };
  let competencias: { exists: jest.Mock<Promise<boolean>, [string]> };

  const MAPA_ID = 'mapa-1';

  beforeEach(() => {
    mapas = {
      findOne: jest.fn<Promise<PartialMapa | null>, unknown[]>(),
      find: jest.fn<Promise<PartialMapa[]>, unknown[]>(),
      create: jest.fn((data: PartialMapa) => data),
      save: jest.fn((data: PartialMapa) =>
        Promise.resolve({ id: MAPA_ID, ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    nodos = {
      findOne: jest.fn<Promise<PartialNodo | null>, unknown[]>(),
      find: jest.fn<Promise<PartialNodo[]>, unknown[]>(),
      count: jest.fn<Promise<number>, unknown[]>(),
      exists: jest.fn<Promise<boolean>, unknown[]>(),
      create: jest.fn((data: PartialNodo) => data),
      save: jest.fn((data: PartialNodo) =>
        Promise.resolve({ id: 'nodo-1', ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    recursos = { exists: jest.fn<Promise<boolean>, unknown[]>() };
    competencias = { exists: jest.fn<Promise<boolean>, [string]>() };

    service = new MapasService(
      mapas as unknown as Repository<MapaMental>,
      nodos as unknown as Repository<NodoMapa>,
      recursos as unknown as Repository<Recurso>,
      competencias as unknown as CompetenciasService,
    );
  });

  describe('addNodo', () => {
    it('rejects when parentId does not belong to the same mapa', async () => {
      mapas.findOne.mockResolvedValue({ id: MAPA_ID });
      nodos.exists.mockResolvedValue(false);

      await expect(
        service.addNodo(MAPA_ID, {
          label: 'Rama',
          parentId: 'nodo-de-otro-mapa',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a root node when parentId is omitted', async () => {
      mapas.findOne.mockResolvedValue({ id: MAPA_ID });
      nodos.count.mockResolvedValue(0);

      const nodo = await service.addNodo(MAPA_ID, { label: 'Tema central' });

      expect(nodo.parentId).toBeNull();
      expect(nodo.orden).toBe(1);
    });

    it('creates a child node when parentId belongs to the mapa', async () => {
      mapas.findOne.mockResolvedValue({ id: MAPA_ID });
      nodos.exists.mockResolvedValue(true);
      nodos.count.mockResolvedValue(0);

      const nodo = await service.addNodo(MAPA_ID, {
        label: 'Rama',
        parentId: 'raiz-1',
      });

      expect(nodo.parentId).toBe('raiz-1');
    });
  });

  describe('updateNodo', () => {
    it('rejects when a node is set as its own parent', async () => {
      nodos.findOne.mockResolvedValue({ id: 'nodo-1', mapaId: MAPA_ID });

      await expect(
        service.updateNodo('nodo-1', { parentId: 'nodo-1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOneConNodos', () => {
    it('returns the mapa with its flat list of nodos', async () => {
      mapas.findOne.mockResolvedValue({ id: MAPA_ID, titulo: 'Comunicación' });
      nodos.find.mockResolvedValue([
        { id: 'raiz', parentId: null, label: 'Tema' },
        { id: 'hijo', parentId: 'raiz', label: 'Rama' },
      ]);

      const mapa = await service.findOneConNodos(MAPA_ID);

      expect(mapa.nodos).toHaveLength(2);
      expect(mapa.titulo).toBe('Comunicación');
    });
  });

  describe('remove', () => {
    it('deletes the mapa without checking for existing history', async () => {
      mapas.findOne.mockResolvedValue({ id: MAPA_ID });

      await service.remove(MAPA_ID);

      expect(mapas.delete).toHaveBeenCalledWith({ id: MAPA_ID });
    });

    it('throws NotFoundException when the mapa does not exist', async () => {
      mapas.findOne.mockResolvedValue(null);

      await expect(service.remove(MAPA_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('rejects when the competencia does not exist', async () => {
      competencias.exists.mockResolvedValue(false);

      await expect(
        service.create({ titulo: 'Mapa', competenciaId: 'comp-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
