import { NotFoundException } from '@nestjs/common';
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
});
