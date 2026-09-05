import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DisponibilidadCoach } from './entities/disponibilidad-coach.entity';
import { SolicitudSesion } from './entities/solicitud-sesion.entity';
import { EstadoSolicitudSesion } from './enums/estado-solicitud-sesion.enum';
import { CreateBloqueDisponibilidadDto } from './dto/create-bloque-disponibilidad.dto';
import { SesionesService } from './sesiones.service';
import { SESION_DURACION_MINUTOS } from './sesiones.constants';
import { localChileAUtc } from '../common/chile-time.util';

const UN_DIA_MS = 24 * 60 * 60 * 1000;

function seSuperponen(a: Date, b: Date): boolean {
  const duracionMs = SESION_DURACION_MINUTOS * 60_000;
  return Math.abs(a.getTime() - b.getTime()) < duracionMs;
}

@Injectable()
export class DisponibilidadService {
  constructor(
    @InjectRepository(DisponibilidadCoach)
    private readonly bloques: Repository<DisponibilidadCoach>,
    @InjectRepository(SolicitudSesion)
    private readonly solicitudes: Repository<SolicitudSesion>,
    private readonly sesiones: SesionesService,
  ) {}

  listBloques(): Promise<DisponibilidadCoach[]> {
    return this.bloques.find({
      order: { diaSemana: 'ASC', horaInicio: 'ASC' },
    });
  }

  async crearBloque(
    dto: CreateBloqueDisponibilidadDto,
  ): Promise<DisponibilidadCoach> {
    if (dto.horaInicio >= dto.horaFin) {
      throw new BadRequestException('horaInicio debe ser antes que horaFin.');
    }
    return this.bloques.save(this.bloques.create(dto));
  }

  async eliminarBloque(id: string): Promise<void> {
    const result = await this.bloques.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Bloque de disponibilidad no encontrado.');
    }
  }

  // Genera los horarios libres dentro de [desde, hasta] (fechas calendario, "YYYY-MM-DD")
  // cruzando los bloques semanales del coach con las sesiones ya agendadas (cualquier
  // coachee) y las solicitudes de sesión todavía pendientes — sin esto último, dos coachees
  // podrían ver y pedir el mismo horario libre sin saber que ya lo pidió el otro.
  async calcularSlotsLibres(desde: Date, hasta: Date): Promise<Date[]> {
    const bloques = await this.listBloques();
    if (bloques.length === 0) return [];

    const candidatos: Map<string, Date> = new Map();
    for (
      let cursor = new Date(desde);
      cursor.getTime() <= hasta.getTime();
      cursor = new Date(cursor.getTime() + UN_DIA_MS)
    ) {
      const anio = cursor.getUTCFullYear();
      const mes = cursor.getUTCMonth() + 1;
      const dia = cursor.getUTCDate();
      const diaSemana = cursor.getUTCDay();

      for (const bloque of bloques.filter((b) => b.diaSemana === diaSemana)) {
        for (
          let minutos = horaAMinutos(bloque.horaInicio);
          minutos + SESION_DURACION_MINUTOS <= horaAMinutos(bloque.horaFin);
          minutos += SESION_DURACION_MINUTOS
        ) {
          const horaMinuto = minutosAHora(minutos);
          const instante = localChileAUtc(anio, mes, dia, horaMinuto);
          candidatos.set(instante.toISOString(), instante);
        }
      }
    }

    if (candidatos.size === 0) return [];

    // Ventana amplia (±1 día) porque la conversión Chile→UTC puede correr un candidato al
    // día calendario UTC siguiente o anterior a `desde`/`hasta`.
    const [ocupadas, pendientes] = await Promise.all([
      this.sesiones.findEnRango(
        new Date(desde.getTime() - UN_DIA_MS),
        new Date(hasta.getTime() + UN_DIA_MS),
      ),
      this.solicitudes.find({
        where: {
          estado: EstadoSolicitudSesion.PENDIENTE,
          fechaHoraPropuesta: Between(
            new Date(desde.getTime() - UN_DIA_MS),
            new Date(hasta.getTime() + UN_DIA_MS),
          ),
        },
      }),
    ]);
    const ocupadasFechas = [
      ...ocupadas.map((s) => s.fechaHora),
      ...pendientes.map((s) => s.fechaHoraPropuesta),
    ];

    const ahora = new Date();
    return [...candidatos.values()]
      .filter((c) => c.getTime() > ahora.getTime())
      .filter((c) => !ocupadasFechas.some((o) => seSuperponen(c, o)))
      .sort((a, b) => a.getTime() - b.getTime());
  }
}

function horaAMinutos(horaMinuto: string): number {
  const [h, m] = horaMinuto.split(':').map(Number);
  return h * 60 + m;
}

function minutosAHora(totalMinutos: number): string {
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
