import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, MoreThan, Repository } from 'typeorm';
import { Sesion } from './entities/sesion.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { CreateSesionDto } from './dto/create-sesion.dto';
import { CreateSerieSesionesDto } from './dto/create-serie-sesiones.dto';
import { UpdateSesionDto } from './dto/update-sesion.dto';
import { randomUUID } from 'crypto';
import { CoacheesService } from '../coachees/coachees.service';
import { SESION_DURACION_MINUTOS } from './sesiones.constants';

export type SesionSinNotasPrivadas = Omit<Sesion, 'notasPrivadas'>;

@Injectable()
export class SesionesService {
  constructor(
    @InjectRepository(Sesion) private readonly sesiones: Repository<Sesion>,
    @InjectRepository(CicloCoaching)
    private readonly ciclos: Repository<CicloCoaching>,
    private readonly coachees: CoacheesService,
  ) {}

  private stripPrivateNotes(sesion: Sesion): SesionSinNotasPrivadas {
    const rest: Partial<Sesion> = { ...sesion };
    delete rest.notasPrivadas;
    return rest as SesionSinNotasPrivadas;
  }

  // Dos sesiones (de cualquier coachee — un solo coach en todo el sistema) se solapan si el
  // intervalo [fechaHora, fechaHora + duración) de una cae dentro del de la otra. Se trae una
  // ventana amplia con Between y se filtra en JS en vez de armar el intervalo en SQL — el
  // volumen es bajo (un coach) y evita fecha aritmética específica de Postgres en el servicio.
  private async hayConflictoDeHorario(
    fechaHora: Date,
    excluirSesionId?: string,
  ): Promise<boolean> {
    const duracionMs = SESION_DURACION_MINUTOS * 60_000;
    const finPropuesta = new Date(fechaHora.getTime() + duracionMs);
    const candidatas = await this.sesiones.find({
      where: {
        fechaHora: Between(
          new Date(fechaHora.getTime() - duracionMs),
          new Date(fechaHora.getTime() + duracionMs),
        ),
      },
    });
    return candidatas.some((s) => {
      if (excluirSesionId && s.id === excluirSesionId) return false;
      const finExistente = new Date(s.fechaHora.getTime() + duracionMs);
      return fechaHora < finExistente && s.fechaHora < finPropuesta;
    });
  }

  async create(dto: CreateSesionDto): Promise<Sesion> {
    if (!(await this.coachees.exists(dto.coacheeId))) {
      throw new NotFoundException('Coachee no encontrado.');
    }
    const fechaHora = new Date(dto.fechaHora);
    if (await this.hayConflictoDeHorario(fechaHora)) {
      throw new ConflictException(
        'Ya existe una sesión agendada que se superpone con ese horario.',
      );
    }
    // La sesión queda vinculada al ciclo abierto del coachee (si existe), para que
    // el conteo de "sesiones restantes" y el informe final del ciclo sean exactos.
    const cicloAbierto = await this.ciclos.findOne({
      where: { coacheeId: dto.coacheeId, fechaCierre: IsNull() },
    });
    return this.sesiones.save(
      this.sesiones.create({
        coacheeId: dto.coacheeId,
        cicloId: cicloAbierto?.id ?? null,
        fechaHora,
        linkVideollamada: dto.linkVideollamada ?? null,
      }),
    );
  }

  /**
   * Sesión fija semanal — genera `cantidadSesiones` filas de `Sesion`, una por semana desde
   * `fechaHora`, todas compartiendo un `recurrenciaId` nuevo. Todo o nada: si CUALQUIERA de
   * las fechas generadas choca con una sesión ya agendada, no se crea ninguna — dejar la mitad
   * de una serie a medio crear sería más confuso que simplemente rechazarla y que el coach
   * ajuste el horario elegido.
   */
  async crearSerie(dto: CreateSerieSesionesDto): Promise<Sesion[]> {
    if (!(await this.coachees.exists(dto.coacheeId))) {
      throw new NotFoundException('Coachee no encontrado.');
    }
    const primera = new Date(dto.fechaHora);
    const fechas: Date[] = Array.from(
      { length: dto.cantidadSesiones },
      (_, i) => new Date(primera.getTime() + i * 7 * 24 * 60 * 60_000),
    );
    for (const fecha of fechas) {
      if (await this.hayConflictoDeHorario(fecha)) {
        throw new ConflictException(
          `Ya existe una sesión agendada que se superpone con el ${fecha.toLocaleString('es-CL')} — no se creó ninguna sesión de la serie.`,
        );
      }
    }
    const cicloAbierto = await this.ciclos.findOne({
      where: { coacheeId: dto.coacheeId, fechaCierre: IsNull() },
    });
    const recurrenciaId = randomUUID();
    const filas = fechas.map((fechaHora) =>
      this.sesiones.create({
        coacheeId: dto.coacheeId,
        cicloId: cicloAbierto?.id ?? null,
        fechaHora,
        linkVideollamada: dto.linkVideollamada ?? null,
        recurrenciaId,
      }),
    );
    return this.sesiones.save(filas);
  }

  findAllForCoach(coacheeId?: string): Promise<Sesion[]> {
    return this.sesiones.find({
      where: coacheeId ? { coacheeId } : {},
      order: { fechaHora: 'ASC' },
    });
  }

  // Todas las sesiones de todos los coachees, con el nombre del coachee — para la agenda
  // global del coach (hoy WeekCalendar solo se usaba acotado a un coachee a la vez).
  findTodasConCoachee(): Promise<Sesion[]> {
    return this.sesiones.find({
      relations: { coachee: true },
      order: { fechaHora: 'ASC' },
    });
  }

  // Ventana de sesiones existentes (cualquier coachee) para calcular disponibilidad.
  findEnRango(desde: Date, hasta: Date): Promise<Sesion[]> {
    return this.sesiones.find({ where: { fechaHora: Between(desde, hasta) } });
  }

  // Sesiones de una ventana de fechas, con el nombre del coachee y su empresa — para el
  // bloque "Esta semana" del dashboard del coach (a diferencia de findTodasConCoachee(), acá
  // también hace falta la empresa: el requerimiento pide "coachee/empresa" por sesión).
  findEnRangoConCoachee(desde: Date, hasta: Date): Promise<Sesion[]> {
    return this.sesiones.find({
      where: { fechaHora: Between(desde, hasta) },
      relations: { coachee: { empresa: true } },
      order: { fechaHora: 'ASC' },
    });
  }

  async findOneFull(id: string): Promise<Sesion> {
    const sesion = await this.sesiones.findOne({ where: { id } });
    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada.');
    }
    return sesion;
  }

  async findOneOwnedByCoachee(
    sesionId: string,
    coacheeId: string,
  ): Promise<Sesion> {
    const sesion = await this.sesiones.findOne({
      where: { id: sesionId, coacheeId },
    });
    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada.');
    }
    return sesion;
  }

  async confirmar(
    sesionId: string,
    actorUserId: string,
  ): Promise<SesionSinNotasPrivadas> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    const sesion = await this.findOneOwnedByCoachee(sesionId, coachee.id);
    sesion.confirmada = true;
    await this.sesiones.save(sesion);
    return this.stripPrivateNotes(sesion);
  }

  async resolveCoacheeIdForActor(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return coachee.id;
  }

  async findAllForCoachee(
    actorUserId: string,
  ): Promise<SesionSinNotasPrivadas[]> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    const sesiones = await this.sesiones.find({
      where: { coacheeId: coachee.id },
      order: { fechaHora: 'ASC' },
    });
    return sesiones.map((s) => this.stripPrivateNotes(s));
  }

  async findProximaForCoachee(
    actorUserId: string,
  ): Promise<SesionSinNotasPrivadas | null> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return this.findProximaForCoacheeId(coachee.id);
  }

  async findProximaForCoacheeId(
    coacheeId: string,
  ): Promise<SesionSinNotasPrivadas | null> {
    const proxima = await this.sesiones.findOne({
      where: { coacheeId, fechaHora: MoreThan(new Date()) },
      order: { fechaHora: 'ASC' },
    });
    return proxima ? this.stripPrivateNotes(proxima) : null;
  }

  async update(id: string, dto: UpdateSesionDto): Promise<Sesion> {
    const sesion = await this.findOneFull(id);
    let deltaMs: number | null = null;
    if (dto.fechaHora !== undefined) {
      const fechaHora = new Date(dto.fechaHora);
      if (await this.hayConflictoDeHorario(fechaHora, id)) {
        throw new ConflictException(
          'Ya existe una sesión agendada que se superpone con ese horario.',
        );
      }
      deltaMs = fechaHora.getTime() - sesion.fechaHora.getTime();
      sesion.fechaHora = fechaHora;
    }
    if (dto.linkVideollamada !== undefined) {
      sesion.linkVideollamada = dto.linkVideollamada;
    }
    if (dto.resumenCompartido !== undefined) {
      sesion.resumenCompartido = dto.resumenCompartido;
    }
    if (dto.notasPrivadas !== undefined) {
      sesion.notasPrivadas = dto.notasPrivadas;
    }
    if (dto.temaTratado !== undefined) {
      sesion.temaTratado = dto.temaTratado;
    }
    if (dto.ejerciciosAplicados !== undefined) {
      sesion.ejerciciosAplicados = dto.ejerciciosAplicados;
    }
    if (dto.acuerdos !== undefined) {
      sesion.acuerdos = dto.acuerdos;
    }
    if (dto.asistio !== undefined) {
      sesion.asistio = dto.asistio;
    }
    const guardada = await this.sesiones.save(sesion);

    if (dto.aplicarASerie && deltaMs !== null && sesion.recurrenciaId) {
      await this.aplicarDeltaAFuturasDeLaSerie(
        sesion.recurrenciaId,
        id,
        deltaMs,
      );
    }
    return guardada;
  }

  /**
   * "Esta y las siguientes" al reagendar: aplica el mismo desplazamiento horario a toda
   * sesión FUTURA de la misma serie (las pasadas/ya realizadas nunca se tocan). Best-effort
   * por fila — si alguna sesión futura choca al desplazarla (ej. el coach ya agendó otra
   * cosa en ese horario para otra semana), esa puntual se deja como estaba en vez de
   * fallar toda la operación: la sesión principal ya se movió con éxito.
   */
  private async aplicarDeltaAFuturasDeLaSerie(
    recurrenciaId: string,
    exceptoId: string,
    deltaMs: number,
  ): Promise<void> {
    const futuras = await this.sesiones.find({
      where: { recurrenciaId, fechaHora: MoreThan(new Date()) },
    });
    for (const otra of futuras) {
      if (otra.id === exceptoId) continue;
      const nuevaFecha = new Date(otra.fechaHora.getTime() + deltaMs);
      if (await this.hayConflictoDeHorario(nuevaFecha, otra.id)) continue;
      otra.fechaHora = nuevaFecha;
      await this.sesiones.save(otra);
    }
  }

  async remove(
    id: string,
    aplicarASerie = false,
  ): Promise<{ eliminadas: number }> {
    const sesion = await this.findOneFull(id);
    if (aplicarASerie && sesion.recurrenciaId) {
      // Siempre incluye `id` (aunque por algún motivo ya no fuera futura) además de
      // cualquier otra futura de la misma serie — las pasadas/ya realizadas no se tocan.
      const { affected } = await this.sesiones
        .createQueryBuilder()
        .delete()
        .where('recurrencia_id = :recurrenciaId', {
          recurrenciaId: sesion.recurrenciaId,
        })
        .andWhere('(fecha_hora > :ahora OR id = :id)', {
          ahora: new Date(),
          id,
        })
        .execute();
      return { eliminadas: affected ?? 0 };
    }
    await this.sesiones.delete(id);
    return { eliminadas: 1 };
  }
}
