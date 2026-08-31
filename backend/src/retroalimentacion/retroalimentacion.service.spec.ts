import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RetroalimentacionService } from './retroalimentacion.service';
import { RetroalimentacionCierre } from './entities/retroalimentacion-cierre.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { CoacheesService } from '../coachees/coachees.service';
import { CreateRetroalimentacionDto } from './dto/create-retroalimentacion.dto';

type Partial1 = Partial<RetroalimentacionCierre>;

describe('RetroalimentacionService', () => {
  let service: RetroalimentacionService;
  let repo: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    exists: jest.Mock;
  };
  let ciclos: { findOne: jest.Mock };
  let coachees: { findByUserId: jest.Mock };

  const dto: CreateRetroalimentacionDto = {
    cicloId: 'ciclo-1',
    respuestas: [
      {
        bloque: 'Evaluación del Proceso',
        afirmacion: 'El objetivo fue claro',
        valor: 5,
      },
    ],
  };

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      create: jest.fn((data: Partial1) => data),
      save: jest.fn((data: Partial1) =>
        Promise.resolve({ id: 'generated', ...data }),
      ),
      exists: jest.fn(),
    };
    ciclos = { findOne: jest.fn() };
    coachees = { findByUserId: jest.fn() };
    service = new RetroalimentacionService(
      repo as unknown as Repository<RetroalimentacionCierre>,
      ciclos as unknown as Repository<CicloCoaching>,
      coachees as unknown as CoacheesService,
    );
  });

  describe('addOwn', () => {
    it('rejects when the actor has no coachee profile', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(service.addOwn('user-x', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects when the ciclo does not belong to the coachee', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      ciclos.findOne.mockResolvedValue(null);

      await expect(service.addOwn('user-1', dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(ciclos.findOne).toHaveBeenCalledWith({
        where: { id: 'ciclo-1', coacheeId: 'c1' },
      });
    });

    it('rejects a second retroalimentación for the same ciclo', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      ciclos.findOne.mockResolvedValue({ id: 'ciclo-1', coacheeId: 'c1' });
      repo.exists.mockResolvedValue(true);

      await expect(service.addOwn('user-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates the retroalimentación scoped to the resolved coachee', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      ciclos.findOne.mockResolvedValue({ id: 'ciclo-1', coacheeId: 'c1' });
      repo.exists.mockResolvedValue(false);

      const creada = await service.addOwn('user-1', dto);

      expect(creada.coacheeId).toBe('c1');
      expect(creada.cicloId).toBe('ciclo-1');
      expect(creada.respuestas).toEqual(dto.respuestas);
    });
  });

  describe('listOwn', () => {
    it('rejects when the actor has no coachee profile', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(service.listOwn('user-x')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lists retroalimentaciones scoped to the resolved coachee', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      repo.find.mockResolvedValue([{ id: 'r1', coacheeId: 'c1' }]);

      const resultado = await service.listOwn('user-1');

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { coacheeId: 'c1' } }),
      );
      expect(resultado).toHaveLength(1);
    });
  });
});
