import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { SolicitudReagendamiento } from './entities/solicitud-reagendamiento.entity';
import { EstadoSolicitud } from './enums/estado-solicitud.enum';
import { ResponderSolicitudDto } from './dto/responder-solicitud.dto';
import { SesionesService } from './sesiones.service';
import { CoacheesService } from '../coachees/coachees.service';
import { UsersService } from '../users/users.service';
import { Role } from '../auth/enums/role.enum';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { TipoNotificacion } from '../notificaciones/enums/tipo-notificacion.enum';
import { EmailService } from '../email/email.service';

@Injectable()
export class SolicitudesReagendamientoService {
  constructor(
    @InjectRepository(SolicitudReagendamiento)
    private readonly solicitudes: Repository<SolicitudReagendamiento>,
    private readonly sesiones: SesionesService,
    private readonly coachees: CoacheesService,
    private readonly users: UsersService,
    private readonly notificaciones: NotificacionesService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async create(
    sesionId: string,
    actorUserId: string,
    motivo?: string,
  ): Promise<SolicitudReagendamiento> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    const sesion = await this.sesiones.findOneOwnedByCoachee(
      sesionId,
      coachee.id,
    );

    const solicitud = await this.solicitudes.save(
      this.solicitudes.create({
        sesionId,
        coacheeId: coachee.id,
        motivo: motivo ?? null,
      }),
    );

    const mensaje = `${coachee.nombre} solicitó reagendar su sesión del ${new Date(sesion.fechaHora).toLocaleString('es-CL')}`;
    const verUrl = `${this.config.get<string>('frontendUrl')}/coach/comercial`;
    const coaches = await this.users.findAllByRole(Role.COACH);
    for (const coach of coaches) {
      void this.notificaciones.crear(
        coach.id,
        TipoNotificacion.REAGENDAMIENTO_SOLICITADO,
        mensaje,
        '/coach/comercial',
      );
      void this.email.sendReagendamientoSolicitado({
        to: coach.email,
        nombreCoachee: coachee.nombre,
        fechaHoraSesion: sesion.fechaHora.toISOString(),
        motivo: motivo ?? null,
        verUrl,
      });
    }

    return solicitud;
  }

  findAllPending(): Promise<SolicitudReagendamiento[]> {
    return this.solicitudes.find({
      where: { estado: EstadoSolicitud.PENDIENTE },
      relations: { sesion: true, coachee: true },
      order: { createdAt: 'ASC' },
    });
  }

  async responder(
    id: string,
    dto: ResponderSolicitudDto,
  ): Promise<SolicitudReagendamiento> {
    const solicitud = await this.solicitudes.findOne({
      where: { id },
      relations: { sesion: true, coachee: { user: true } },
    });
    if (!solicitud) {
      throw new NotFoundException('Solicitud not found');
    }
    const fechaOriginal = solicitud.sesion?.fechaHora.toISOString();

    if (dto.nuevaFechaHora) {
      await this.sesiones.update(solicitud.sesionId, {
        fechaHora: dto.nuevaFechaHora,
      });
    }
    if (dto.respuestaCoach !== undefined) {
      solicitud.respuestaCoach = dto.respuestaCoach;
    }
    solicitud.estado = EstadoSolicitud.RESUELTA;
    solicitud.resolvedAt = new Date();

    const resultado = await this.solicitudes.save(solicitud);

    if (solicitud.coachee) {
      void this.notificaciones.crear(
        solicitud.coachee.userId,
        TipoNotificacion.REAGENDAMIENTO_RESUELTO,
        'Tu coach respondió tu solicitud de reagendamiento',
        '/coachee/sesiones',
      );
      if (solicitud.coachee.user?.email && fechaOriginal) {
        void this.email.sendReagendamientoResuelto({
          to: solicitud.coachee.user.email,
          fechaHoraSesion: fechaOriginal,
          nuevaFechaHora: dto.nuevaFechaHora ?? null,
          respuestaCoach: dto.respuestaCoach ?? null,
          verUrl: `${this.config.get<string>('frontendUrl')}/coachee/sesiones`,
        });
      }
    }

    return resultado;
  }
}
