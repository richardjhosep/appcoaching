import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { SolicitudSesion } from './entities/solicitud-sesion.entity';
import { EstadoSolicitudSesion } from './enums/estado-solicitud-sesion.enum';
import { ResponderSolicitudSesionDto } from './dto/responder-solicitud-sesion.dto';
import { DisponibilidadService } from './disponibilidad.service';
import { SesionesService } from './sesiones.service';
import { CoacheesService } from '../coachees/coachees.service';
import { UsersService } from '../users/users.service';
import { Role } from '../auth/enums/role.enum';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { TipoNotificacion } from '../notificaciones/enums/tipo-notificacion.enum';
import { EmailService } from '../email/email.service';

const UN_DIA_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SolicitudesSesionService {
  constructor(
    @InjectRepository(SolicitudSesion)
    private readonly solicitudes: Repository<SolicitudSesion>,
    private readonly disponibilidad: DisponibilidadService,
    private readonly sesionesService: SesionesService,
    private readonly coachees: CoacheesService,
    private readonly users: UsersService,
    private readonly notificaciones: NotificacionesService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async crear(
    actorUserId: string,
    fechaHoraPropuestaIso: string,
    motivo?: string,
  ): Promise<SolicitudSesion> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    const fechaHoraPropuesta = new Date(fechaHoraPropuestaIso);
    if (fechaHoraPropuesta.getTime() <= Date.now()) {
      throw new BadRequestException(
        'No se puede pedir una sesión en el pasado.',
      );
    }

    // Re-valida que el horario sigue libre justo antes de guardar — evita ofrecer un slot
    // que ya se ocupó entre que el coachee lo vio y lo pidió.
    const slotsDelDia = await this.disponibilidad.calcularSlotsLibres(
      new Date(fechaHoraPropuesta.getTime() - UN_DIA_MS),
      new Date(fechaHoraPropuesta.getTime() + UN_DIA_MS),
    );
    const sigueLibre = slotsDelDia.some(
      (s) => s.getTime() === fechaHoraPropuesta.getTime(),
    );
    if (!sigueLibre) {
      throw new ConflictException('Ese horario ya no está disponible.');
    }

    let solicitud: SolicitudSesion;
    try {
      solicitud = await this.solicitudes.save(
        this.solicitudes.create({
          coacheeId: coachee.id,
          fechaHoraPropuesta,
          motivo: motivo ?? null,
        }),
      );
    } catch (err) {
      // Índice único parcial en (fecha_hora_propuesta) WHERE estado='pendiente' — cierra la
      // carrera de dos coachees pidiendo el mismo slot casi al mismo tiempo; la validación de
      // arriba evita la mayoría de los casos, esto es la garantía dura a nivel de base.
      if ((err as { code?: string }).code === '23505') {
        throw new ConflictException(
          'Ese horario acaba de ser tomado por otro coachee.',
        );
      }
      throw err;
    }

    const mensaje = `${coachee.nombre} pidió una sesión para el ${fechaHoraPropuesta.toLocaleString('es-CL')}`;
    const verUrl = `${this.config.get<string>('frontendUrl')}/coach/agenda`;
    const coaches = await this.users.findAllByRole(Role.COACH);
    for (const coach of coaches) {
      void this.notificaciones.crear(
        coach.id,
        TipoNotificacion.SOLICITUD_SESION_CREADA,
        mensaje,
        '/coach/agenda',
      );
      void this.email.sendSolicitudSesionCreada({
        to: coach.email,
        nombreCoachee: coachee.nombre,
        fechaHoraPropuesta: fechaHoraPropuesta.toISOString(),
        motivo: motivo ?? null,
        verUrl,
      });
    }

    return solicitud;
  }

  findAllPending(): Promise<SolicitudSesion[]> {
    return this.solicitudes.find({
      where: { estado: EstadoSolicitudSesion.PENDIENTE },
      relations: { coachee: true },
      order: { createdAt: 'ASC' },
    });
  }

  async responder(
    id: string,
    dto: ResponderSolicitudSesionDto,
  ): Promise<SolicitudSesion> {
    const solicitud = await this.solicitudes.findOne({
      where: { id },
      relations: { coachee: { user: true } },
    });
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada.');
    }
    if (solicitud.estado !== EstadoSolicitudSesion.PENDIENTE) {
      throw new ConflictException('Esta solicitud ya fue resuelta.');
    }
    if (dto.aprobar && solicitud.fechaHoraPropuesta.getTime() <= Date.now()) {
      throw new BadRequestException(
        'No se puede aprobar una solicitud con horario pasado.',
      );
    }

    if (dto.aprobar) {
      const sesion = await this.sesionesService.create({
        coacheeId: solicitud.coacheeId,
        fechaHora: solicitud.fechaHoraPropuesta.toISOString(),
      });
      solicitud.sesionCreadaId = sesion.id;
      solicitud.estado = EstadoSolicitudSesion.APROBADA;
    } else {
      solicitud.estado = EstadoSolicitudSesion.RECHAZADA;
    }
    if (dto.respuestaCoach !== undefined) {
      solicitud.respuestaCoach = dto.respuestaCoach;
    }
    solicitud.resolvedAt = new Date();

    const resultado = await this.solicitudes.save(solicitud);

    if (solicitud.coachee) {
      void this.notificaciones.crear(
        solicitud.coachee.userId,
        TipoNotificacion.SOLICITUD_SESION_RESUELTA,
        dto.aprobar
          ? 'Tu coach confirmó la sesión que pediste'
          : 'Tu coach no pudo confirmar la sesión que pediste',
        '/coachee/sesiones',
      );
      if (solicitud.coachee.user?.email) {
        void this.email.sendSolicitudSesionResuelta({
          to: solicitud.coachee.user.email,
          fechaHoraPropuesta: solicitud.fechaHoraPropuesta.toISOString(),
          aprobada: dto.aprobar,
          respuestaCoach: dto.respuestaCoach ?? null,
          verUrl: `${this.config.get<string>('frontendUrl')}/coachee/sesiones`,
        });
      }
    }

    return resultado;
  }
}
