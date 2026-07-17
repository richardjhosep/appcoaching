import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SeguimientoService } from './seguimiento.service';
import { Logro } from './entities/logro.entity';
import { EntradaDiario } from './entities/entrada-diario.entity';
import { CoacheesService } from '../coachees/coachees.service';
import { PostSesionesService } from '../sesiones/post-sesiones.service';

type PartialLogro = Partial<Logro>;
type PartialDiario = Partial<EntradaDiario>;

describe('SeguimientoService', () => {
  let service: SeguimientoService;
  let logrosRepo: {
    find: jest.Mock<Promise<PartialLogro[]>, unknown[]>;
    create: jest.Mock<PartialLogro, [PartialLogro]>;
    save: jest.Mock<Promise<PartialLogro>, [PartialLogro]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let diariosRepo: {
    findOne: jest.Mock<Promise<PartialDiario | null>, unknown[]>;
    create: jest.Mock<PartialDiario, [PartialDiario]>;
    save: jest.Mock<Promise<PartialDiario>, [PartialDiario]>;
  };
  let coachees: { findByUserId: jest.Mock };
  let postSesiones: {
    avanceGeneral: jest.Mock;
    findAllPublicadasForCoachee: jest.Mock;
  };

  beforeEach(() => {
    logrosRepo = {
      find: jest.fn<Promise<PartialLogro[]>, unknown[]>(),
      create: jest.fn((data: PartialLogro) => data),
      save: jest.fn((data: PartialLogro) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    diariosRepo = {
      findOne: jest.fn<Promise<PartialDiario | null>, unknown[]>(),
      create: jest.fn((data: PartialDiario) => data),
      save: jest.fn((data: PartialDiario) =>
        Promise.resolve({ id: 'generated-id', contenido: '', ...data }),
      ),
    };
    coachees = { findByUserId: jest.fn() };
    postSesiones = {
      avanceGeneral: jest.fn(),
      findAllPublicadasForCoachee: jest.fn(),
    };
    service = new SeguimientoService(
      logrosRepo as unknown as Repository<Logro>,
      diariosRepo as unknown as Repository<EntradaDiario>,
      coachees as unknown as CoacheesService,
      postSesiones as unknown as PostSesionesService,
    );
  });

  describe('addLogroOwn / listLogrosOwn / removeLogroOwn', () => {
    it('rejects when the actor has no coachee profile', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(
        service.addLogroOwn('user-x', {
          fecha: '2026-07-01',
          descripcion: 'x',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a logro scoped to the actor coachee', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });

      const logro = await service.addLogroOwn('user-1', {
        fecha: '2026-07-01',
        descripcion: 'primer logro',
      });

      expect(logro.coacheeId).toBe('coachee-1');
    });

    it('rejects deleting a logro that is not owned by the actor', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      logrosRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(
        service.removeLogroOwn('user-1', 'other-logro'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDiarioOwn / updateDiarioOwn', () => {
    it('auto-creates a blank diario the first time', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      diariosRepo.findOne.mockResolvedValue(null);

      const diario = await service.getDiarioOwn('user-1');

      expect(diario.coacheeId).toBe('coachee-1');
      expect(diariosRepo.save).toHaveBeenCalled();
    });

    it('updates the existing diario contenido', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      diariosRepo.findOne.mockResolvedValue({
        id: 'd1',
        coacheeId: 'coachee-1',
        contenido: 'viejo',
      });

      const diario = await service.updateDiarioOwn('user-1', 'nuevo contenido');

      expect(diario.contenido).toBe('nuevo contenido');
    });
  });

  describe('avanceGeneralOwn', () => {
    it('delegates to PostSesionesService.avanceGeneral for the actor coachee', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      postSesiones.avanceGeneral.mockResolvedValue(70);

      const avance = await service.avanceGeneralOwn('user-1');

      expect(postSesiones.avanceGeneral).toHaveBeenCalledWith('coachee-1');
      expect(avance).toBe(70);
    });
  });
});
