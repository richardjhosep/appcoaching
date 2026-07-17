import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudReagendamiento } from './entities/solicitud-reagendamiento.entity';
import { EstadoSolicitud } from './enums/estado-solicitud.enum';
import { ResponderSolicitudDto } from './dto/responder-solicitud.dto';
import { SesionesService } from './sesiones.service';
import { CoacheesService } from '../coachees/coachees.service';

@Injectable()
export class SolicitudesReagendamientoService {
  constructor(
    @InjectRepository(SolicitudReagendamiento)
    private readonly solicitudes: Repository<SolicitudReagendamiento>,
    private readonly sesiones: SesionesService,
    private readonly coachees: CoacheesService,
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
    await this.sesiones.findOneOwnedByCoachee(sesionId, coachee.id);

    return this.solicitudes.save(
      this.solicitudes.create({
        sesionId,
        coacheeId: coachee.id,
        motivo: motivo ?? null,
      }),
    );
  }

  findAllPending(): Promise<SolicitudReagendamiento[]> {
    return this.solicitudes.find({
      where: { estado: EstadoSolicitud.PENDIENTE },
      order: { createdAt: 'ASC' },
    });
  }

  async responder(
    id: string,
    dto: ResponderSolicitudDto,
  ): Promise<SolicitudReagendamiento> {
    const solicitud = await this.solicitudes.findOne({ where: { id } });
    if (!solicitud) {
      throw new NotFoundException('Solicitud not found');
    }

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

    return this.solicitudes.save(solicitud);
  }
}
