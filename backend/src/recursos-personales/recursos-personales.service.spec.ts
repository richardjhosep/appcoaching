import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RecursosPersonalesService } from './recursos-personales.service';
import { RecursoPersonal } from './entities/recurso-personal.entity';
import { CategoriaRecursoPersonal } from './enums/categoria-recurso-personal.enum';
import { CoacheesService } from '../coachees/coachees.service';

type PartialRecurso = Partial<RecursoPersonal>;

describe('RecursosPersonalesService', () => {
  let service: RecursosPersonalesService;
  let repo: {
    findOne: jest.Mock<Promise<PartialRecurso | null>, unknown[]>;
    find: jest.Mock<Promise<PartialRecurso[]>, unknown[]>;
    create: jest.Mock<PartialRecurso, [PartialRecurso]>;
    save: jest.Mock<Promise<PartialRecurso>, [PartialRecurso]>;
    delete: jest.Mock;
  };
  let coachees: { findByUserId: jest.Mock };

  beforeEach(() => {
    repo = {
      findOne: jest.fn<Promise<PartialRecurso | null>, unknown[]>(),
      find: jest
        .fn<Promise<PartialRecurso[]>, unknown[]>()
        .mockResolvedValue([]),
      create: jest.fn((data: PartialRecurso) => data),
      save: jest.fn((data: PartialRecurso) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    coachees = { findByUserId: jest.fn() };
    service = new RecursosPersonalesService(
      repo as unknown as Repository<RecursoPersonal>,
      coachees as unknown as CoacheesService,
    );
  });

  describe('create', () => {
    it('crea un recurso personal para el coachee autenticado', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });

      const recurso = await service.create('user-1', {
        categoria: CategoriaRecursoPersonal.LIBRO,
        titulo: 'Crucial Conversations',
        notas: 'Recomendado por mi coach',
      });

      expect(recurso).toEqual(
        expect.objectContaining({
          coacheeId: 'coachee-1',
          categoria: CategoriaRecursoPersonal.LIBRO,
          titulo: 'Crucial Conversations',
          url: null,
          notas: 'Recomendado por mi coach',
        }),
      );
    });

    it('lanza NotFoundException si el actor no tiene perfil de coachee', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(
        service.create('user-x', {
          categoria: CategoriaRecursoPersonal.LIBRO,
          titulo: 'x',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('actualizar — ownership', () => {
    it('actualiza un recurso propio', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      repo.findOne.mockResolvedValue({
        id: 'r1',
        coacheeId: 'coachee-1',
        titulo: 'vieja',
      });

      const recurso = await service.actualizar('user-1', 'r1', {
        titulo: 'nueva',
      });

      expect(recurso.titulo).toBe('nueva');
    });

    it('rechaza actualizar un recurso que no es del actor', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      // El repo real filtra por coacheeId en el where — simulamos que no lo encuentra.
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.actualizar('user-1', 'r-ajeno', { titulo: 'x' }),
      ).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('eliminar — ownership', () => {
    it('rechaza eliminar un recurso que no es del actor', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      repo.findOne.mockResolvedValue(null);

      await expect(service.eliminar('user-1', 'r-ajeno')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  describe('listar', () => {
    it('lista solo los recursos del coachee autenticado, más recientes primero', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });

      await service.listar('user-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { coacheeId: 'coachee-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
