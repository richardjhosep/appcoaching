import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostSesionesService } from './post-sesiones.service';
import { PostSesion } from './entities/post-sesion.entity';
import { SesionesService } from './sesiones.service';

type PartialPostSesion = Partial<PostSesion>;

function makeQueryBuilder(result: unknown) {
  const qb: Record<string, jest.Mock> = {};
  qb.innerJoinAndSelect = jest.fn(() => qb);
  qb.where = jest.fn(() => qb);
  qb.andWhere = jest.fn(() => qb);
  qb.orderBy = jest.fn(() => qb);
  qb.getMany = jest.fn(() => Promise.resolve(result));
  qb.getOne = jest.fn(() => Promise.resolve(result));
  return qb;
}

describe('PostSesionesService', () => {
  let service: PostSesionesService;
  let repo: {
    findOne: jest.Mock<Promise<PartialPostSesion | null>, unknown[]>;
    create: jest.Mock<PartialPostSesion, [PartialPostSesion]>;
    save: jest.Mock<Promise<PartialPostSesion>, [PartialPostSesion]>;
    createQueryBuilder: jest.Mock;
  };
  let sesiones: {
    findOneOwnedByCoachee: jest.Mock;
    resolveCoacheeIdForActor: jest.Mock;
  };

  const YA_REALIZADA = {
    id: 's1',
    coacheeId: 'coachee-1',
    fechaHora: new Date('2020-01-01'),
  };

  beforeEach(() => {
    repo = {
      findOne: jest.fn<Promise<PartialPostSesion | null>, unknown[]>(),
      create: jest.fn((data: PartialPostSesion) => data),
      save: jest.fn((data: PartialPostSesion) =>
        Promise.resolve({ id: 'generated-id', publicada: false, ...data }),
      ),
      createQueryBuilder: jest.fn(),
    };
    sesiones = {
      findOneOwnedByCoachee: jest.fn().mockResolvedValue(YA_REALIZADA),
      resolveCoacheeIdForActor: jest.fn().mockResolvedValue('coachee-1'),
    };
    service = new PostSesionesService(
      repo as unknown as Repository<PostSesion>,
      sesiones as unknown as SesionesService,
    );
  });

  describe('upsertOwn', () => {
    it('rejects editing a session that has not happened yet', async () => {
      sesiones.findOneOwnedByCoachee.mockResolvedValue({
        id: 's1',
        coacheeId: 'coachee-1',
        fechaHora: new Date('2999-01-01'),
      });

      await expect(
        service.upsertOwn('user-1', 's1', { aprendizaje: 'x' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a draft and applies only the given fields', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.upsertOwn('user-1', 's1', {
        aprendizaje: 'aprendí bastante',
      });

      expect(result.aprendizaje).toBe('aprendí bastante');
      expect(result.publicada).toBe(false);
    });

    it('rejects editing once published', async () => {
      repo.findOne.mockResolvedValue({
        id: 'p1',
        sesionId: 's1',
        publicada: true,
      });

      await expect(
        service.upsertOwn('user-1', 's1', { aprendizaje: 'x' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('publicarOwn', () => {
    it('rejects publishing without the required fields', async () => {
      repo.findOne.mockResolvedValue({
        id: 'p1',
        sesionId: 's1',
        publicada: false,
        aprendizaje: null,
        utilidad: null,
        cercaniaObjetivo: null,
      });

      await expect(service.publicarOwn('user-1', 's1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('publishes when all required fields are present', async () => {
      repo.findOne.mockResolvedValue({
        id: 'p1',
        sesionId: 's1',
        publicada: false,
        aprendizaje: 'aprendí',
        utilidad: 4,
        cercaniaObjetivo: 7,
      });

      const result = await service.publicarOwn('user-1', 's1');

      expect(result.publicada).toBe(true);
    });

    it('rejects publishing twice', async () => {
      repo.findOne.mockResolvedValue({
        id: 'p1',
        sesionId: 's1',
        publicada: true,
      });

      await expect(service.publicarOwn('user-1', 's1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('avanceGeneral', () => {
    it('returns null when there is no published self-assessment', async () => {
      repo.createQueryBuilder.mockReturnValue(makeQueryBuilder(null));

      const result = await service.avanceGeneral('coachee-1');

      expect(result).toBeNull();
    });

    it('converts the latest cercaniaObjetivo (1-10) to a percentage', async () => {
      repo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder({
          cercaniaObjetivo: 7,
          sesion: { fechaHora: new Date() },
        }),
      );

      const result = await service.avanceGeneral('coachee-1');

      expect(result).toBe(70);
    });
  });

  describe('findAllPublicadasForCoachee', () => {
    it('maps rows to the timeline shape', async () => {
      const fecha = new Date('2026-05-01');
      repo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder([
          { sesionId: 's1', cercaniaObjetivo: 5, sesion: { fechaHora: fecha } },
        ]),
      );

      const result = await service.findAllPublicadasForCoachee('coachee-1');

      expect(result).toEqual([{ sesionId: 's1', fecha, cercaniaObjetivo: 5 }]);
    });
  });
});
