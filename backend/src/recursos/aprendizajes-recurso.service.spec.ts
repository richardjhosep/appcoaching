import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AprendizajesRecursoService } from './aprendizajes-recurso.service';
import { AprendizajeRecurso } from './entities/aprendizaje-recurso.entity';
import { RecursosService } from './recursos.service';
import { CoacheesService } from '../coachees/coachees.service';

type PartialAprendizaje = Partial<AprendizajeRecurso>;

describe('AprendizajesRecursoService', () => {
  let service: AprendizajesRecursoService;
  let repo: {
    find: jest.Mock<Promise<PartialAprendizaje[]>, unknown[]>;
    create: jest.Mock<PartialAprendizaje, [PartialAprendizaje]>;
    save: jest.Mock<Promise<PartialAprendizaje>, [PartialAprendizaje]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let recursos: { assertEnBibliotecaDeCoachee: jest.Mock };
  let coachees: { findByUserId: jest.Mock };

  beforeEach(() => {
    repo = {
      find: jest.fn<Promise<PartialAprendizaje[]>, unknown[]>(),
      create: jest.fn((data: PartialAprendizaje) => data),
      save: jest.fn((data: PartialAprendizaje) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    recursos = { assertEnBibliotecaDeCoachee: jest.fn() };
    coachees = { findByUserId: jest.fn() };
    service = new AprendizajesRecursoService(
      repo as unknown as Repository<AprendizajeRecurso>,
      recursos as unknown as RecursosService,
      coachees as unknown as CoacheesService,
    );
  });

  describe('addOwn', () => {
    it('rejects when the resource is not in the biblioteca', async () => {
      recursos.assertEnBibliotecaDeCoachee.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        service.addOwn('user-1', 'r1', 'aprendí algo'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('creates the aprendizaje scoped to the resolved coachee', async () => {
      recursos.assertEnBibliotecaDeCoachee.mockResolvedValue('c1');

      const aprendizaje = await service.addOwn('user-1', 'r1', 'aprendí algo');

      expect(aprendizaje.coacheeId).toBe('c1');
      expect(aprendizaje.recursoId).toBe('r1');
    });
  });

  describe('removeOwn', () => {
    it('rejects when the actor has no coachee profile', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(service.removeOwn('user-x', 'a1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects deleting an aprendizaje not owned by the actor', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      repo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.removeOwn('user-1', 'other')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
