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
    orIgnore: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(() => {
    insertBuilder = {
      insert: jest.fn(),
      into: jest.fn(),
      values: jest.fn(),
      orIgnore: jest.fn(),
      execute: jest.fn(),
    };
    insertBuilder.insert.mockReturnValue(insertBuilder);
    insertBuilder.into.mockReturnValue(insertBuilder);
    insertBuilder.values.mockReturnValue(insertBuilder);
    insertBuilder.orIgnore.mockReturnValue(insertBuilder);

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
    it('seeds the full catalog when the table is empty', async () => {
      insertBuilder.execute.mockResolvedValue({
        identifiers: COMPETENCIAS_SEED.map(() => ({ id: 'generated' })),
      });

      await service.onApplicationBootstrap();

      expect(insertBuilder.values).toHaveBeenCalledWith(COMPETENCIAS_SEED);
      expect(insertBuilder.orIgnore).toHaveBeenCalled();
    });

    it('does not fail when every row was already seeded (ON CONFLICT DO NOTHING)', async () => {
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
