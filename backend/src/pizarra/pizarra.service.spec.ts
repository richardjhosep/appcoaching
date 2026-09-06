import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PizarraService } from './pizarra.service';
import { NotaPizarra } from './entities/nota-pizarra.entity';
import { CoacheesService } from '../coachees/coachees.service';

type PartialNota = Partial<NotaPizarra>;

describe('PizarraService', () => {
  let service: PizarraService;
  let repo: {
    findOne: jest.Mock<Promise<PartialNota | null>, unknown[]>;
    find: jest.Mock<Promise<PartialNota[]>, unknown[]>;
    create: jest.Mock<PartialNota, [PartialNota]>;
    save: jest.Mock<Promise<PartialNota>, [PartialNota]>;
    delete: jest.Mock;
  };
  let coachees: { findByUserId: jest.Mock };

  beforeEach(() => {
    repo = {
      findOne: jest.fn<Promise<PartialNota | null>, unknown[]>(),
      find: jest.fn<Promise<PartialNota[]>, unknown[]>().mockResolvedValue([]),
      create: jest.fn((data: PartialNota) => data),
      save: jest.fn((data: PartialNota) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    coachees = { findByUserId: jest.fn() };
    service = new PizarraService(
      repo as unknown as Repository<NotaPizarra>,
      coachees as unknown as CoacheesService,
    );
  });

  describe('create', () => {
    it('crea una nota en la posición dada, con color por defecto si no se especifica', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });

      const nota = await service.create('user-1', { posX: 100, posY: 200 });

      expect(nota).toEqual(
        expect.objectContaining({
          coacheeId: 'coachee-1',
          posX: 100,
          posY: 200,
          texto: '',
        }),
      );
      expect(typeof nota.color).toBe('string');
      expect(nota.color.length).toBeGreaterThan(0);
    });

    it('lanza NotFoundException si el actor no tiene perfil de coachee', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(
        service.create('user-x', { posX: 0, posY: 0 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('actualizar — ownership', () => {
    it('actualiza una nota propia', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      repo.findOne.mockResolvedValue({
        id: 'n1',
        coacheeId: 'coachee-1',
        texto: 'vieja',
      });

      const nota = await service.actualizar('user-1', 'n1', { texto: 'nueva' });

      expect(nota.texto).toBe('nueva');
    });

    it('rechaza actualizar una nota que no es del actor', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      // El repo real filtra por coacheeId en el where — simulamos que no la encuentra.
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.actualizar('user-1', 'n-ajena', { texto: 'x' }),
      ).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('eliminar — ownership', () => {
    it('rechaza eliminar una nota que no es del actor', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      repo.findOne.mockResolvedValue(null);

      await expect(service.eliminar('user-1', 'n-ajena')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
