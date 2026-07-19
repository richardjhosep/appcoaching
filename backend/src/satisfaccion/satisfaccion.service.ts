import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { EncuestaSatisfaccion } from './entities/encuesta-satisfaccion.entity';
import { SolicitudProceso } from './entities/solicitud-proceso.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { CreateEncuestaDto } from './dto/create-encuesta.dto';
import { CreateSolicitudProcesoDto } from './dto/create-solicitud-proceso.dto';
import { EstadoSolicitudProceso } from './enums/estado-solicitud-proceso.enum';

export interface KpisEmpresa {
  procesosTerminados: number;
  procesosEnCurso: number;
  tasaAsistencia: number | null;
  satisfaccionPromedio: number | null;
}

@Injectable()
export class SatisfaccionService {
  constructor(
    @InjectRepository(EncuestaSatisfaccion)
    private readonly encuestas: Repository<EncuestaSatisfaccion>,
    @InjectRepository(SolicitudProceso)
    private readonly solicitudes: Repository<SolicitudProceso>,
    @InjectRepository(Coachee) private readonly coachees: Repository<Coachee>,
    @InjectRepository(CicloCoaching)
    private readonly ciclos: Repository<CicloCoaching>,
    @InjectRepository(Sesion) private readonly sesiones: Repository<Sesion>,
  ) {}

  crearEncuesta(
    empresaId: string,
    dto: CreateEncuestaDto,
  ): Promise<EncuestaSatisfaccion> {
    return this.encuestas.save(
      this.encuestas.create({
        empresaId,
        calificacion: dto.calificacion,
        comentario: dto.comentario ?? null,
      }),
    );
  }

  listarEncuestas(empresaId: string): Promise<EncuestaSatisfaccion[]> {
    return this.encuestas.find({
      where: { empresaId },
      order: { createdAt: 'DESC' },
    });
  }

  crearSolicitud(
    empresaId: string,
    dto: CreateSolicitudProcesoDto,
  ): Promise<SolicitudProceso> {
    return this.solicitudes.save(
      this.solicitudes.create({
        empresaId,
        nombreSugerido: dto.nombreSugerido,
        mensaje: dto.mensaje ?? null,
      }),
    );
  }

  listarSolicitudesPropias(empresaId: string): Promise<SolicitudProceso[]> {
    return this.solicitudes.find({
      where: { empresaId },
      order: { createdAt: 'DESC' },
    });
  }

  listarSolicitudes(
    estado?: EstadoSolicitudProceso,
  ): Promise<SolicitudProceso[]> {
    return this.solicitudes.find({
      where: estado ? { estado } : {},
      relations: { empresa: true },
      order: { createdAt: 'DESC' },
    });
  }

  async marcarAtendida(id: string): Promise<SolicitudProceso> {
    const solicitud = await this.solicitudes.findOne({ where: { id } });
    if (!solicitud) {
      throw new NotFoundException('Solicitud not found');
    }
    solicitud.estado = EstadoSolicitudProceso.ATENDIDA;
    return this.solicitudes.save(solicitud);
  }

  async kpis(empresaId: string): Promise<KpisEmpresa> {
    const coacheesEmpresa = await this.coachees.find({ where: { empresaId } });
    const coacheeIds = coacheesEmpresa.map((c) => c.id);

    if (coacheeIds.length === 0) {
      const satisfaccion = await this.promedioSatisfaccion(empresaId);
      return {
        procesosTerminados: 0,
        procesosEnCurso: 0,
        tasaAsistencia: null,
        satisfaccionPromedio: satisfaccion,
      };
    }

    const [
      procesosTerminados,
      procesosEnCurso,
      sesionesConAsistencia,
      sesionesAsistidas,
    ] = await Promise.all([
      this.ciclos.count({
        where: { coacheeId: In(coacheeIds), fechaCierre: Not(IsNull()) },
      }),
      this.ciclos.count({
        where: { coacheeId: In(coacheeIds), fechaCierre: IsNull() },
      }),
      this.sesiones.count({
        where: { coacheeId: In(coacheeIds), asistio: Not(IsNull()) },
      }),
      this.sesiones.count({
        where: { coacheeId: In(coacheeIds), asistio: true },
      }),
    ]);

    const satisfaccion = await this.promedioSatisfaccion(empresaId);

    return {
      procesosTerminados,
      procesosEnCurso,
      tasaAsistencia:
        sesionesConAsistencia > 0
          ? Math.round((sesionesAsistidas / sesionesConAsistencia) * 100)
          : null,
      satisfaccionPromedio: satisfaccion,
    };
  }

  private async promedioSatisfaccion(
    empresaId: string,
  ): Promise<number | null> {
    const result = await this.encuestas
      .createQueryBuilder('encuesta')
      .select('AVG(encuesta.calificacion)', 'avg')
      .where('encuesta.empresa_id = :empresaId', { empresaId })
      .getRawOne<{ avg: string | null }>();
    return result?.avg ? Math.round(Number(result.avg) * 10) / 10 : null;
  }
}
