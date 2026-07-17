import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SolicitudesReagendamientoService } from './solicitudes-reagendamiento.service';
import { SolicitudReagendamiento } from './entities/solicitud-reagendamiento.entity';
import { EstadoSolicitud } from './enums/estado-solicitud.enum';
import { SesionesService } from './sesiones.service';
import { CoacheesService } from '../coachees/coachees.service';

type PartialSolicitud = Partial<SolicitudReagendamiento>;

describe('SolicitudesReagendamientoService', () => {
  let service: SolicitudesReagendamientoService;
  let repo: {
    findOne: jest.Mock<Promise<PartialSolicitud | null>, unknown[]>;
    find: jest.Mock<Promise<PartialSolicitud[]>, unknown[]>;
    create: jest.Mock<PartialSolicitud, [PartialSolicitud]>;
    save: jest.Mock<Promise<PartialSolicitud>, [PartialSolicitud]>;
  };
  let sesiones: {
    findOneOwnedByCoachee: jest.Mock;
    update: jest.Mock;
  };
  let coachees: { findByUserId: jest.Mock };

  beforeEach(() => {
    repo = {
      findOne: jest.fn<Promise<PartialSolicitud | null>, unknown[]>(),
      find: jest.fn<Promise<PartialSolicitud[]>, unknown[]>(),
      create: jest.fn((data: PartialSolicitud) => data),
      save: jest.fn((data: PartialSolicitud) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
    };
    sesiones = {
      findOneOwnedByCoachee: jest.fn(),
      update: jest.fn(),
    };
    coachees = { findByUserId: jest.fn() };
    service = new SolicitudesReagendamientoService(
      repo as unknown as Repository<SolicitudReagendamiento>,
      sesiones as unknown as SesionesService,
      coachees as unknown as CoacheesService,
    );
  });

  describe('create', () => {
    it('throws NotFoundException when the actor has no coachee profile', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(service.create('s1', 'user-x', 'motivo')).rejects.toThrow(
        NotFoundException,
      );
      expect(sesiones.findOneOwnedByCoachee).not.toHaveBeenCalled();
    });

    it('propagates the error when the session does not belong to the actor', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      sesiones.findOneOwnedByCoachee.mockRejectedValue(new NotFoundException());

      await expect(service.create('s1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates the request when the session belongs to the actor', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      sesiones.findOneOwnedByCoachee.mockResolvedValue({
        id: 's1',
        coacheeId: 'coachee-1',
      });

      const solicitud = await service.create('s1', 'user-1', 'tengo un viaje');

      expect(solicitud.sesionId).toBe('s1');
      expect(solicitud.coacheeId).toBe('coachee-1');
      expect(solicitud.motivo).toBe('tengo un viaje');
    });
  });

  describe('responder', () => {
    it('throws NotFoundException when the request does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.responder('missing', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates the session date when nuevaFechaHora is given', async () => {
      repo.findOne.mockResolvedValue({
        id: 'req-1',
        sesionId: 's1',
        estado: EstadoSolicitud.PENDIENTE,
      });

      await service.responder('req-1', {
        nuevaFechaHora: '2026-08-05T15:00:00.000Z',
      });

      expect(sesiones.update).toHaveBeenCalledWith('s1', {
        fechaHora: '2026-08-05T15:00:00.000Z',
      });
    });

    it('marks the request as resolved and stores the coach response', async () => {
      repo.findOne.mockResolvedValue({
        id: 'req-1',
        sesionId: 's1',
        estado: EstadoSolicitud.PENDIENTE,
      });

      const solicitud = await service.responder('req-1', {
        respuestaCoach:
          'Tengo disponible el martes a las 10 o el jueves a las 15',
      });

      expect(solicitud.estado).toBe(EstadoSolicitud.RESUELTA);
      expect(solicitud.respuestaCoach).toBe(
        'Tengo disponible el martes a las 10 o el jueves a las 15',
      );
      expect(solicitud.resolvedAt).toBeInstanceOf(Date);
      expect(sesiones.update).not.toHaveBeenCalled();
    });
  });
});
