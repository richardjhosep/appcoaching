import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SolicitudesReagendamientoService } from './solicitudes-reagendamiento.service';
import { SolicitudReagendamiento } from './entities/solicitud-reagendamiento.entity';
import { EstadoSolicitud } from './enums/estado-solicitud.enum';
import { SesionesService } from './sesiones.service';
import { CoacheesService } from '../coachees/coachees.service';
import { UsersService } from '../users/users.service';
import { Role } from '../auth/enums/role.enum';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { TipoNotificacion } from '../notificaciones/enums/tipo-notificacion.enum';
import { EmailService } from '../email/email.service';

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
  let users: { findAllByRole: jest.Mock };
  let notificaciones: { crear: jest.Mock };
  let email: {
    sendReagendamientoSolicitado: jest.Mock;
    sendReagendamientoResuelto: jest.Mock;
  };
  let config: { get: jest.Mock };

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
    users = { findAllByRole: jest.fn().mockResolvedValue([]) };
    notificaciones = { crear: jest.fn() };
    email = {
      sendReagendamientoSolicitado: jest.fn(),
      sendReagendamientoResuelto: jest.fn(),
    };
    config = { get: jest.fn().mockReturnValue('http://localhost:5173') };
    service = new SolicitudesReagendamientoService(
      repo as unknown as Repository<SolicitudReagendamiento>,
      sesiones as unknown as SesionesService,
      coachees as unknown as CoacheesService,
      users as unknown as UsersService,
      notificaciones as unknown as NotificacionesService,
      email as unknown as EmailService,
      config as unknown as ConfigService,
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
      coachees.findByUserId.mockResolvedValue({
        id: 'coachee-1',
        nombre: 'Ana',
      });
      sesiones.findOneOwnedByCoachee.mockResolvedValue({
        id: 's1',
        coacheeId: 'coachee-1',
        fechaHora: new Date('2026-08-05T15:00:00.000Z'),
      });

      const solicitud = await service.create('s1', 'user-1', 'tengo un viaje');

      expect(solicitud.sesionId).toBe('s1');
      expect(solicitud.coacheeId).toBe('coachee-1');
      expect(solicitud.motivo).toBe('tengo un viaje');
    });

    it('notifies and emails every coach', async () => {
      coachees.findByUserId.mockResolvedValue({
        id: 'coachee-1',
        nombre: 'Ana',
      });
      sesiones.findOneOwnedByCoachee.mockResolvedValue({
        id: 's1',
        coacheeId: 'coachee-1',
        fechaHora: new Date('2026-08-05T15:00:00.000Z'),
      });
      users.findAllByRole.mockResolvedValue([
        { id: 'coach-1', email: 'coach1@example.com' },
        { id: 'coach-2', email: 'coach2@example.com' },
      ]);

      await service.create('s1', 'user-1', 'tengo un viaje');

      expect(users.findAllByRole).toHaveBeenCalledWith(Role.COACH);
      expect(notificaciones.crear).toHaveBeenCalledTimes(2);
      expect(notificaciones.crear).toHaveBeenCalledWith(
        'coach-1',
        TipoNotificacion.REAGENDAMIENTO_SOLICITADO,
        expect.stringContaining('Ana') as string,
        '/coach/comercial',
      );
      expect(email.sendReagendamientoSolicitado).toHaveBeenCalledTimes(2);
      expect(email.sendReagendamientoSolicitado).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'coach1@example.com',
          nombreCoachee: 'Ana',
          motivo: 'tengo un viaje',
        }),
      );
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
        sesion: { fechaHora: new Date('2026-08-05T15:00:00.000Z') },
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
        sesion: { fechaHora: new Date('2026-08-05T15:00:00.000Z') },
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

    it('notifies and emails the coachee when resolved', async () => {
      repo.findOne.mockResolvedValue({
        id: 'req-1',
        sesionId: 's1',
        estado: EstadoSolicitud.PENDIENTE,
        sesion: { fechaHora: new Date('2026-08-05T15:00:00.000Z') },
        coachee: {
          userId: 'user-coachee-1',
          user: { email: 'coachee@example.com' },
        },
      });

      await service.responder('req-1', {
        nuevaFechaHora: '2026-08-06T15:00:00.000Z',
        respuestaCoach: 'Nos vemos el jueves',
      });

      expect(notificaciones.crear).toHaveBeenCalledWith(
        'user-coachee-1',
        TipoNotificacion.REAGENDAMIENTO_RESUELTO,
        expect.any(String) as string,
        '/coachee/sesiones',
      );
      expect(email.sendReagendamientoResuelto).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'coachee@example.com',
          nuevaFechaHora: '2026-08-06T15:00:00.000Z',
          respuestaCoach: 'Nos vemos el jueves',
        }),
      );
    });

    it('does not email when the coachee has no linked user email', async () => {
      repo.findOne.mockResolvedValue({
        id: 'req-1',
        sesionId: 's1',
        estado: EstadoSolicitud.PENDIENTE,
        sesion: { fechaHora: new Date('2026-08-05T15:00:00.000Z') },
        coachee: { userId: 'user-coachee-1', user: undefined },
      });

      await service.responder('req-1', {});

      expect(notificaciones.crear).toHaveBeenCalled();
      expect(email.sendReagendamientoResuelto).not.toHaveBeenCalled();
    });
  });
});
