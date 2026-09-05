import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SolicitudesSesionService } from './solicitudes-sesion.service';
import { SolicitudSesion } from './entities/solicitud-sesion.entity';
import { EstadoSolicitudSesion } from './enums/estado-solicitud-sesion.enum';
import { DisponibilidadService } from './disponibilidad.service';
import { SesionesService } from './sesiones.service';
import { CoacheesService } from '../coachees/coachees.service';
import { UsersService } from '../users/users.service';
import { Role } from '../auth/enums/role.enum';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { TipoNotificacion } from '../notificaciones/enums/tipo-notificacion.enum';
import { EmailService } from '../email/email.service';

type PartialSolicitud = Partial<SolicitudSesion>;

// Muy en el futuro respecto de la fecha "actual" de estos tests, para no chocar con el
// rechazo de "no se puede pedir en el pasado".
const FECHA_FUTURA = '2027-03-08T13:00:00.000Z';

describe('SolicitudesSesionService', () => {
  let service: SolicitudesSesionService;
  let repo: {
    findOne: jest.Mock<Promise<PartialSolicitud | null>, unknown[]>;
    create: jest.Mock<PartialSolicitud, [PartialSolicitud]>;
    save: jest.Mock<Promise<PartialSolicitud>, [PartialSolicitud]>;
  };
  let disponibilidad: { calcularSlotsLibres: jest.Mock };
  let sesionesService: { create: jest.Mock };
  let coachees: { findByUserId: jest.Mock };
  let users: { findAllByRole: jest.Mock };
  let notificaciones: { crear: jest.Mock };
  let email: {
    sendSolicitudSesionCreada: jest.Mock;
    sendSolicitudSesionResuelta: jest.Mock;
  };
  let config: { get: jest.Mock };

  beforeEach(() => {
    repo = {
      findOne: jest.fn<Promise<PartialSolicitud | null>, unknown[]>(),
      create: jest.fn((data: PartialSolicitud) => data),
      save: jest.fn((data: PartialSolicitud) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
    };
    disponibilidad = {
      calcularSlotsLibres: jest
        .fn()
        .mockResolvedValue([new Date(FECHA_FUTURA)]),
    };
    sesionesService = {
      create: jest.fn().mockResolvedValue({ id: 'sesion-1' }),
    };
    coachees = { findByUserId: jest.fn() };
    users = { findAllByRole: jest.fn().mockResolvedValue([]) };
    notificaciones = { crear: jest.fn() };
    email = {
      sendSolicitudSesionCreada: jest.fn(),
      sendSolicitudSesionResuelta: jest.fn(),
    };
    config = { get: jest.fn().mockReturnValue('http://localhost:5173') };
    service = new SolicitudesSesionService(
      repo as unknown as Repository<SolicitudSesion>,
      disponibilidad as unknown as DisponibilidadService,
      sesionesService as unknown as SesionesService,
      coachees as unknown as CoacheesService,
      users as unknown as UsersService,
      notificaciones as unknown as NotificacionesService,
      email as unknown as EmailService,
      config as unknown as ConfigService,
    );
  });

  describe('crear', () => {
    it('throws NotFoundException when the actor has no coachee profile', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      await expect(service.crear('user-x', FECHA_FUTURA)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects a fechaHoraPropuesta in the past', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });

      await expect(
        service.crear('user-1', '2020-01-01T12:00:00.000Z'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when the slot is no longer free', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });
      disponibilidad.calcularSlotsLibres.mockResolvedValue([]);

      await expect(service.crear('user-1', FECHA_FUTURA)).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates the request when the slot is free', async () => {
      coachees.findByUserId.mockResolvedValue({
        id: 'coachee-1',
        nombre: 'Ana',
      });

      const solicitud = await service.crear('user-1', FECHA_FUTURA, 'motivo x');

      expect(solicitud.coacheeId).toBe('coachee-1');
      expect(solicitud.motivo).toBe('motivo x');
    });

    it('notifies and emails every coach', async () => {
      coachees.findByUserId.mockResolvedValue({
        id: 'coachee-1',
        nombre: 'Ana',
      });
      users.findAllByRole.mockResolvedValue([
        { id: 'coach-1', email: 'coach1@example.com' },
      ]);

      await service.crear('user-1', FECHA_FUTURA, 'motivo x');

      expect(users.findAllByRole).toHaveBeenCalledWith(Role.COACH);
      expect(notificaciones.crear).toHaveBeenCalledWith(
        'coach-1',
        TipoNotificacion.SOLICITUD_SESION_CREADA,
        expect.stringContaining('Ana') as string,
        '/coach/agenda',
      );
      expect(email.sendSolicitudSesionCreada).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'coach1@example.com',
          nombreCoachee: 'Ana',
        }),
      );
    });

    it('translates a unique-constraint race into ConflictException', async () => {
      coachees.findByUserId.mockResolvedValue({
        id: 'coachee-1',
        nombre: 'Ana',
      });
      repo.save.mockRejectedValue({ code: '23505' });

      await expect(service.crear('user-1', FECHA_FUTURA)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('responder', () => {
    it('throws NotFoundException when the request does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.responder('missing', { aprobar: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects responding to a request that was already resolved', async () => {
      repo.findOne.mockResolvedValue({
        id: 'req-1',
        estado: EstadoSolicitudSesion.APROBADA,
      });

      await expect(
        service.responder('req-1', { aprobar: true }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects approving a request whose proposed time already passed', async () => {
      repo.findOne.mockResolvedValue({
        id: 'req-1',
        estado: EstadoSolicitudSesion.PENDIENTE,
        fechaHoraPropuesta: new Date('2020-01-01T12:00:00.000Z'),
      });

      await expect(
        service.responder('req-1', { aprobar: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the session and marks the request as aprobada', async () => {
      repo.findOne.mockResolvedValue({
        id: 'req-1',
        coacheeId: 'coachee-1',
        estado: EstadoSolicitudSesion.PENDIENTE,
        fechaHoraPropuesta: new Date(FECHA_FUTURA),
      });

      const solicitud = await service.responder('req-1', { aprobar: true });

      expect(sesionesService.create).toHaveBeenCalledWith({
        coacheeId: 'coachee-1',
        fechaHora: FECHA_FUTURA,
      });
      expect(solicitud.estado).toBe(EstadoSolicitudSesion.APROBADA);
      expect(solicitud.sesionCreadaId).toBe('sesion-1');
    });

    it('rejects the request without creating a session', async () => {
      repo.findOne.mockResolvedValue({
        id: 'req-1',
        coacheeId: 'coachee-1',
        estado: EstadoSolicitudSesion.PENDIENTE,
        fechaHoraPropuesta: new Date(FECHA_FUTURA),
      });

      const solicitud = await service.responder('req-1', {
        aprobar: false,
        respuestaCoach: 'no tengo cupo esa semana',
      });

      expect(sesionesService.create).not.toHaveBeenCalled();
      expect(solicitud.estado).toBe(EstadoSolicitudSesion.RECHAZADA);
      expect(solicitud.respuestaCoach).toBe('no tengo cupo esa semana');
    });

    it('notifies and emails the coachee when resolved', async () => {
      repo.findOne.mockResolvedValue({
        id: 'req-1',
        coacheeId: 'coachee-1',
        estado: EstadoSolicitudSesion.PENDIENTE,
        fechaHoraPropuesta: new Date(FECHA_FUTURA),
        coachee: {
          userId: 'user-coachee-1',
          user: { email: 'coachee@example.com' },
        },
      });

      await service.responder('req-1', { aprobar: true });

      expect(notificaciones.crear).toHaveBeenCalledWith(
        'user-coachee-1',
        TipoNotificacion.SOLICITUD_SESION_RESUELTA,
        expect.any(String) as string,
        '/coachee/sesiones',
      );
      expect(email.sendSolicitudSesionResuelta).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'coachee@example.com', aprobada: true }),
      );
    });

    it('does not email when the coachee has no linked user email', async () => {
      repo.findOne.mockResolvedValue({
        id: 'req-1',
        coacheeId: 'coachee-1',
        estado: EstadoSolicitudSesion.PENDIENTE,
        fechaHoraPropuesta: new Date(FECHA_FUTURA),
        coachee: { userId: 'user-coachee-1', user: undefined },
      });

      await service.responder('req-1', { aprobar: false });

      expect(notificaciones.crear).toHaveBeenCalled();
      expect(email.sendSolicitudSesionResuelta).not.toHaveBeenCalled();
    });
  });
});
