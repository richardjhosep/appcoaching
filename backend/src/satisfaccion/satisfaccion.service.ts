import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, Not, Repository } from 'typeorm';
import { EncuestaSatisfaccion } from './entities/encuesta-satisfaccion.entity';
import { SolicitudProceso } from './entities/solicitud-proceso.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { ResultadoCiclo } from '../ciclos/enums/resultado-ciclo.enum';
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

export interface PuntoTendencia {
  mes: string;
  etiqueta: string;
  satisfaccionPromedio: number | null;
  pctLogrado: number | null;
  tasaAsistencia: number | null;
}

const MESES_ABREV = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

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

  async crearEncuesta(
    empresaId: string,
    dto: CreateEncuestaDto,
  ): Promise<EncuestaSatisfaccion> {
    // Mismo patrón que RetroalimentacionService.addOwn: valida pertenencia vía el ciclo, y
    // pre-chequea la unicidad antes del insert para un error más claro que uno de la base.
    const ciclo = await this.ciclos.findOne({
      where: { id: dto.cicloId },
      relations: { coachee: true },
    });
    if (!ciclo || ciclo.coachee?.empresaId !== empresaId) {
      throw new NotFoundException('Ciclo no encontrado.');
    }
    const yaExiste = await this.encuestas.exists({
      where: { cicloId: dto.cicloId },
    });
    if (yaExiste) {
      throw new ConflictException(
        'Ya se respondió la encuesta de satisfacción de este ciclo.',
      );
    }
    const calificacion = Math.round(
      dto.respuestas.reduce((suma, r) => suma + r.valor, 0) /
        dto.respuestas.length,
    );
    return this.encuestas.save(
      this.encuestas.create({
        empresaId,
        cicloId: dto.cicloId,
        respuestas: dto.respuestas,
        calificacion,
        comentario: dto.comentario ?? null,
      }),
    );
  }

  listarEncuestas(empresaId: string): Promise<EncuestaSatisfaccion[]> {
    return this.encuestas.find({
      where: { empresaId },
      relations: { ciclo: { coachee: true } },
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
      throw new NotFoundException('Solicitud no encontrada.');
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

  private rangosMensuales(cantidad: number): { inicio: Date; fin: Date }[] {
    // Hacia atrás en el tiempo (el mes más antiguo primero) — a diferencia de
    // `NegocioService.cobrosPorMeses`, que proyecta hacia adelante. No se comparte código
    // entre módulos a propósito, mismo criterio ya usado en el resto de este servicio.
    const now = new Date();
    return Array.from({ length: cantidad }, (_, i) => {
      const offset = cantidad - 1 - i;
      return {
        inicio: new Date(now.getFullYear(), now.getMonth() - offset, 1),
        fin: new Date(now.getFullYear(), now.getMonth() - offset + 1, 1),
      };
    });
  }

  private etiquetaMes(inicio: Date): { mes: string; etiqueta: string } {
    return {
      mes: `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`,
      etiqueta: `${MESES_ABREV[inicio.getMonth()]} '${String(inicio.getFullYear()).slice(2)}`,
    };
  }

  /**
   * Evolución mes a mes de las 3 señales reales que ya existen — nada de puntajes
   * fabricados. `pctLogrado` mide los ciclos CERRADOS ese mes (no todos los que están
   * "logrado" a la fecha), para que el punto represente lo que pasó ese mes en particular.
   */
  async tendenciaParaEmpresa(
    empresaId: string,
    meses = 6,
  ): Promise<PuntoTendencia[]> {
    const coacheesEmpresa = await this.coachees.find({ where: { empresaId } });
    const coacheeIds = coacheesEmpresa.map((c) => c.id);
    const rangos = this.rangosMensuales(meses);

    if (coacheeIds.length === 0) {
      return rangos.map((rango) => ({
        ...this.etiquetaMes(rango.inicio),
        satisfaccionPromedio: null,
        pctLogrado: null,
        tasaAsistencia: null,
      }));
    }

    return Promise.all(
      rangos.map(async (rango) => {
        const [
          encuestasDelMes,
          ciclosCerradosDelMes,
          sesionesConAsistencia,
          sesionesAsistidas,
        ] = await Promise.all([
          this.encuestas.find({
            where: { empresaId, createdAt: Between(rango.inicio, rango.fin) },
          }),
          this.ciclos.find({
            where: {
              coacheeId: In(coacheeIds),
              fechaCierre: Between(rango.inicio, rango.fin),
            },
          }),
          this.sesiones.count({
            where: {
              coacheeId: In(coacheeIds),
              fechaHora: Between(rango.inicio, rango.fin),
              asistio: Not(IsNull()),
            },
          }),
          this.sesiones.count({
            where: {
              coacheeId: In(coacheeIds),
              fechaHora: Between(rango.inicio, rango.fin),
              asistio: true,
            },
          }),
        ]);

        const satisfaccionPromedio =
          encuestasDelMes.length > 0
            ? Math.round(
                (encuestasDelMes.reduce((s, e) => s + e.calificacion, 0) /
                  encuestasDelMes.length) *
                  10,
              ) / 10
            : null;
        const logrados = ciclosCerradosDelMes.filter(
          (c) => c.resultado === ResultadoCiclo.LOGRADO,
        ).length;
        const pctLogrado =
          ciclosCerradosDelMes.length > 0
            ? Math.round((logrados / ciclosCerradosDelMes.length) * 100)
            : null;
        const tasaAsistencia =
          sesionesConAsistencia > 0
            ? Math.round((sesionesAsistidas / sesionesConAsistencia) * 100)
            : null;

        return {
          ...this.etiquetaMes(rango.inicio),
          satisfaccionPromedio,
          pctLogrado,
          tasaAsistencia,
        };
      }),
    );
  }
}
