import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CompetenciasService } from './competencias.service';
import { Competencia } from './entities/competencia.entity';
import { COMPETENCIAS_SEED } from './competencias.seed-data';

type PartialCompetencia = Partial<Competencia>;

describe('CompetenciasService', () => {
  let service: CompetenciasService;
  let repo: {
    findOne: jest.Mock<Promise<PartialCompetencia | null>, unknown[]>;
    find: jest.Mock<Promise<PartialCompetencia[]>, unknown[]>;
    exists: jest.Mock<Promise<boolean>, unknown[]>;
    create: jest.Mock<PartialCompetencia, [PartialCompetencia]>;
    save: jest.Mock<Promise<PartialCompetencia>, [PartialCompetencia]>;
    delete: jest.Mock<Promise<unknown>, unknown[]>;
    createQueryBuilder: jest.Mock;
  };
  let insertBuilder: {
    insert: jest.Mock;
    into: jest.Mock;
    values: jest.Mock;
    orUpdate: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(() => {
    insertBuilder = {
      insert: jest.fn(),
      into: jest.fn(),
      values: jest.fn(),
      orUpdate: jest.fn(),
      execute: jest.fn(),
    };
    insertBuilder.insert.mockReturnValue(insertBuilder);
    insertBuilder.into.mockReturnValue(insertBuilder);
    insertBuilder.values.mockReturnValue(insertBuilder);
    insertBuilder.orUpdate.mockReturnValue(insertBuilder);

    repo = {
      findOne: jest.fn<Promise<PartialCompetencia | null>, unknown[]>(),
      find: jest.fn<Promise<PartialCompetencia[]>, unknown[]>(),
      exists: jest.fn<Promise<boolean>, unknown[]>(),
      create: jest.fn((data: PartialCompetencia) => data),
      save: jest.fn((data: PartialCompetencia) =>
        Promise.resolve({ id: 'comp-1', ...data }),
      ),
      delete: jest.fn<Promise<unknown>, unknown[]>(),
      createQueryBuilder: jest.fn().mockReturnValue(insertBuilder),
    };
    service = new CompetenciasService(
      repo as unknown as Repository<Competencia>,
    );
  });

  describe('onApplicationBootstrap', () => {
    it('upserts the full catalog, keeping definicion/niveles synced with the code', async () => {
      insertBuilder.execute.mockResolvedValue({
        identifiers: COMPETENCIAS_SEED.map(() => ({ id: 'generated' })),
      });

      await service.onApplicationBootstrap();

      expect(insertBuilder.values).toHaveBeenCalledWith(COMPETENCIAS_SEED);
      expect(insertBuilder.orUpdate).toHaveBeenCalledWith(
        ['definicion', 'niveles'],
        ['nombre'],
        { indexPredicate: '"empresa_id" IS NULL' },
      );
    });

    it('does not fail when every row already existed (ON CONFLICT DO UPDATE)', async () => {
      insertBuilder.execute.mockResolvedValue({
        identifiers: COMPETENCIAS_SEED.map(() => ({})),
      });

      await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the competencia does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('existsVisibleFor', () => {
    it('returns true for a global competencia regardless of the empresa', async () => {
      repo.findOne.mockResolvedValue({ id: 'c1', empresaId: null });

      await expect(service.existsVisibleFor('c1', 'empresa-a')).resolves.toBe(
        true,
      );
      await expect(service.existsVisibleFor('c1', null)).resolves.toBe(true);
    });

    it('returns true only when the empresa matches the owner', async () => {
      repo.findOne.mockResolvedValue({ id: 'c1', empresaId: 'empresa-a' });

      await expect(service.existsVisibleFor('c1', 'empresa-a')).resolves.toBe(
        true,
      );
      await expect(service.existsVisibleFor('c1', 'empresa-b')).resolves.toBe(
        false,
      );
      await expect(service.existsVisibleFor('c1', null)).resolves.toBe(false);
    });

    it('returns false when the competencia does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.existsVisibleFor('missing', 'empresa-a'),
      ).resolves.toBe(false);
    });
  });

  describe('findVisibleFor', () => {
    it('mixes the global catalog with the empresa-owned rows', async () => {
      repo.find.mockImplementation(
        ({ where }: { where: { empresaId: unknown } }) => {
          // IsNull() y el string plano llegan como objetos/valores distintos — alcanza con
          // distinguir "busca globales" de "busca de una empresa" para este test.
          const buscaGlobales = typeof where.empresaId !== 'string';
          return Promise.resolve(
            buscaGlobales
              ? [{ id: 'g1', nombre: 'Zeta global', empresaId: null }]
              : [{ id: 'e1', nombre: 'Alfa propia', empresaId: 'empresa-a' }],
          );
        },
      );

      const resultado = await service.findVisibleFor('empresa-a');

      expect(resultado.map((c) => c.id)).toEqual(['e1', 'g1']);
    });

    it('returns only the global catalog for an independent coachee (sin empresa)', async () => {
      repo.find.mockResolvedValue([
        { id: 'g1', nombre: 'Global', empresaId: null },
      ]);

      const resultado = await service.findVisibleFor(null);

      expect(resultado).toHaveLength(1);
      expect(repo.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('createForEmpresa', () => {
    it('creates a competencia tagged with the empresa that owns it', async () => {
      const dto = {
        nombre: 'Seguridad Integral',
        definicion: 'Descripción',
        niveles: [{ nivel: 1, descripcion: 'Nivel 1' }],
      };

      const creada = await service.createForEmpresa('empresa-a', dto);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ empresaId: 'empresa-a', ...dto }),
      );
      expect(creada.empresaId).toBe('empresa-a');
    });
  });

  describe('updateForEmpresa', () => {
    it('throws NotFoundException when the competencia belongs to another empresa', async () => {
      repo.findOne.mockResolvedValue({ id: 'c1', empresaId: 'empresa-b' });

      await expect(
        service.updateForEmpresa('empresa-a', 'c1', { nombre: 'Nuevo nombre' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates only the provided fields of an owned competencia', async () => {
      repo.findOne.mockResolvedValue({
        id: 'c1',
        empresaId: 'empresa-a',
        nombre: 'Viejo',
        definicion: 'Vieja definición',
        niveles: [{ nivel: 1, descripcion: 'Viejo nivel' }],
      });

      const actualizada = await service.updateForEmpresa('empresa-a', 'c1', {
        nombre: 'Nuevo',
      });

      expect(actualizada.nombre).toBe('Nuevo');
      expect(actualizada.definicion).toBe('Vieja definición');
    });
  });

  describe('removeForEmpresa', () => {
    it('throws NotFoundException when the competencia is not owned by this empresa', async () => {
      repo.findOne.mockResolvedValue({ id: 'c1', empresaId: 'empresa-b' });

      await expect(service.removeForEmpresa('empresa-a', 'c1')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('translates a foreign-key violation into a friendly ConflictException', async () => {
      repo.findOne.mockResolvedValue({ id: 'c1', empresaId: 'empresa-a' });
      repo.delete.mockRejectedValue({ code: '23503' });

      await expect(service.removeForEmpresa('empresa-a', 'c1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('deletes an owned, unreferenced competencia', async () => {
      repo.findOne.mockResolvedValue({ id: 'c1', empresaId: 'empresa-a' });
      repo.delete.mockResolvedValue({ affected: 1 });

      await expect(
        service.removeForEmpresa('empresa-a', 'c1'),
      ).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith({
        id: 'c1',
        empresaId: 'empresa-a',
      });
    });
  });
});
