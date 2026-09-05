import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';
import { CicloCoaching } from './entities/ciclo-coaching.entity';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { AbrirCicloDto } from './dto/abrir-ciclo.dto';
import { ResultadoCiclo } from './enums/resultado-ciclo.enum';
import { CoacheesService } from '../coachees/coachees.service';
import { PlanesDesarrolloService } from '../planes-desarrollo/planes-desarrollo.service';
import { EstadoPlan } from '../planes-desarrollo/enums/estado-plan.enum';
import { SeguimientoService } from '../seguimiento/seguimiento.service';
import { RetroalimentacionService } from '../retroalimentacion/retroalimentacion.service';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UPLOADS_DIR } from '../recursos/uploads-dir.util';
import { validarPdfSubido } from '../common/file-type-filter.util';

const ALERTA_SESIONES_RESTANTES = 2;

export interface CicloConEstado extends CicloCoaching {
  sesionesRealizadas: number;
  sesionesRestantes: number;
  alertaPorVencer: boolean;
}

@Injectable()
export class CiclosService {
  constructor(
    @InjectRepository(CicloCoaching)
    private readonly ciclos: Repository<CicloCoaching>,
    @InjectRepository(Sesion)
    private readonly sesiones: Repository<Sesion>,
    private readonly coachees: CoacheesService,
    private readonly planesDesarrollo: PlanesDesarrolloService,
    private readonly seguimiento: SeguimientoService,
    private readonly retroalimentacion: RetroalimentacionService,
  ) {}

  private async attachEstado(ciclo: CicloCoaching): Promise<CicloConEstado> {
    const sesionesRealizadas = await this.sesiones.count({
      where: { cicloId: ciclo.id, fechaHora: LessThanOrEqual(new Date()) },
    });
    const sesionesRestantes = Math.max(
      0,
      ciclo.totalSesiones - sesionesRealizadas,
    );
    return {
      ...ciclo,
      sesionesRealizadas,
      sesionesRestantes,
      alertaPorVencer:
        !ciclo.fechaCierre && sesionesRestantes <= ALERTA_SESIONES_RESTANTES,
    };
  }

  async findOne(id: string): Promise<CicloCoaching> {
    const ciclo = await this.ciclos.findOne({ where: { id } });
    if (!ciclo) {
      throw new NotFoundException('Ciclo no encontrado.');
    }
    return ciclo;
  }

  async findOneWithEstado(id: string): Promise<CicloConEstado> {
    return this.attachEstado(await this.findOne(id));
  }

  async abrir(dto: AbrirCicloDto): Promise<CicloConEstado> {
    if (!(await this.coachees.exists(dto.coacheeId))) {
      throw new NotFoundException('Coachee no encontrado.');
    }
    const abierto = await this.ciclos.findOne({
      where: { coacheeId: dto.coacheeId, fechaCierre: IsNull() },
    });
    if (abierto) {
      throw new ConflictException('El coachee ya tiene un ciclo abierto.');
    }
    const ciclo = await this.ciclos.save(
      this.ciclos.create({
        coacheeId: dto.coacheeId,
        totalSesiones: dto.totalSesiones,
        fechaApertura: new Date(),
        resumenReunionInicial: dto.resumenReunionInicial ?? null,
      }),
    );
    return this.attachEstado(ciclo);
  }

  async cerrar(id: string, resultado: ResultadoCiclo): Promise<CicloConEstado> {
    const ciclo = await this.findOne(id);
    if (ciclo.fechaCierre) {
      throw new ConflictException('El ciclo ya está cerrado.');
    }
    // Un ciclo no puede cerrarse si el coachee nunca llegó a tener su plan de
    // desarrollo aprobado — sin plan (fila inexistente) cuenta igual que "no
    // aprobado", no se distingue.
    const plan = await this.planesDesarrollo
      .getByCoacheeId(ciclo.coacheeId)
      .catch(() => null);
    if (plan?.estado !== EstadoPlan.APROBADO) {
      throw new ConflictException(
        'No se puede cerrar el ciclo: el plan de desarrollo del coachee todavía no está aprobado.',
      );
    }
    ciclo.fechaCierre = new Date();
    ciclo.resultado = resultado;
    await this.ciclos.save(ciclo);
    return this.attachEstado(ciclo);
  }

  async updateResumen(id: string, resumen: string): Promise<CicloConEstado> {
    const ciclo = await this.findOne(id);
    ciclo.resumenReunionInicial = resumen;
    await this.ciclos.save(ciclo);
    return this.attachEstado(ciclo);
  }

  async updateInformeFinal(
    id: string,
    informeFinal: string,
  ): Promise<CicloConEstado> {
    const ciclo = await this.findOne(id);
    ciclo.informeFinal = informeFinal;
    await this.ciclos.save(ciclo);
    return this.attachEstado(ciclo);
  }

  async updateImpactoNegocio(
    id: string,
    impactoNegocio: string,
  ): Promise<CicloConEstado> {
    const ciclo = await this.findOne(id);
    ciclo.impactoNegocio = impactoNegocio;
    await this.ciclos.save(ciclo);
    return this.attachEstado(ciclo);
  }

  // Arma un borrador narrativo por secciones (resumen, objetivo del proceso, avances
  // observados, cierre) agregando datos que ya existen en la app — el coach lo sigue
  // pudiendo editar libremente antes de guardarlo, este es solo el punto de partida.
  async generarBorradorInforme(id: string): Promise<CicloConEstado> {
    const ciclo = await this.findOne(id);
    const conEstado = await this.attachEstado(ciclo);

    let objetivoGeneralTexto = 'Sin plan de desarrollo definido.';
    let objetivosTexto = 'Sin objetivos específicos registrados.';
    try {
      const plan = await this.planesDesarrollo.getByCoacheeId(ciclo.coacheeId);
      objetivoGeneralTexto = plan.objetivoGeneral ?? '—';
      const objetivos = plan.objetivos ?? [];
      objetivosTexto =
        objetivos.length > 0
          ? objetivos.map((o) => `- ${o.descripcion}`).join('\n')
          : 'Sin objetivos específicos registrados.';
    } catch {
      // Sin plan de desarrollo todavía: el borrador lo indica y sigue generándose igual.
    }

    const avance = await this.seguimiento.avanceGeneralForCoachee(
      ciclo.coacheeId,
    );
    // Acotado a la ventana de este ciclo (createdAt, no el `fecha` de texto libre que
    // escribe el coachee) — sin esto, el informe de un segundo ciclo arrastraba también
    // los logros del primero, ya cerrado.
    const todosLosLogros = await this.seguimiento.listLogrosForCoachee(
      ciclo.coacheeId,
    );
    const finVentana = ciclo.fechaCierre ?? new Date();
    const logros = todosLosLogros.filter(
      (l) => l.createdAt >= ciclo.fechaApertura && l.createdAt <= finVentana,
    );
    const logrosTexto =
      logros.length > 0
        ? logros.map((l) => `- ${l.fecha}: ${l.descripcion}`).join('\n')
        : 'Sin logros registrados durante el proceso.';

    const retroalimentaciones = await this.retroalimentacion.listForCoachee(
      ciclo.coacheeId,
    );
    const retro =
      retroalimentaciones.find((r) => r.cicloId === ciclo.id) ?? null;

    const periodo = `${ciclo.fechaApertura.toISOString().slice(0, 10)} — ${
      ciclo.fechaCierre
        ? ciclo.fechaCierre.toISOString().slice(0, 10)
        : 'en curso'
    }`;

    const secciones = [
      'INFORME DE CIERRE — Ciclo de Coaching',
      '',
      'Resumen Ejecutivo',
      `Período: ${periodo}`,
      `Sesiones realizadas: ${conEstado.sesionesRealizadas} de ${ciclo.totalSesiones} contratadas.`,
      `Avance general autoevaluado: ${avance !== null ? `${avance}%` : 'sin autoevaluación registrada'}.`,
      ...(ciclo.resultado ? [`Resultado: ${ciclo.resultado}.`] : []),
      '',
      'Objetivo del Proceso',
      objetivoGeneralTexto,
      '',
      'Objetivos Específicos Trabajados',
      objetivosTexto,
      '',
      'Avances Observados',
      logrosTexto,
    ];

    if (retro) {
      secciones.push('', 'Retroalimentación del Coachee al Cierre');
      if (retro.loQueMasGusto) {
        secciones.push(`Lo que más le gustó: ${retro.loQueMasGusto}`);
      }
      if (retro.mayoresAprendizajes) {
        secciones.push(`Mayores aprendizajes: ${retro.mayoresAprendizajes}`);
      }
      if (retro.sugerencias) {
        secciones.push(`Sugerencias: ${retro.sugerencias}`);
      }
      if (retro.otrosComentarios) {
        secciones.push(`Otros comentarios: ${retro.otrosComentarios}`);
      }
    }

    secciones.push('', 'Próximos Pasos', '(a completar por el coach)');

    return this.updateInformeFinal(id, secciones.join('\n'));
  }

  async uploadInformePdf(
    id: string,
    archivo: { originalname: string; filename: string },
  ): Promise<CicloConEstado> {
    const ciclo = await this.findOne(id);
    await validarPdfSubido(archivo, UPLOADS_DIR);
    ciclo.informePdfNombre = archivo.originalname;
    ciclo.informePdfPath = archivo.filename;
    await this.ciclos.save(ciclo);
    return this.attachEstado(ciclo);
  }

  async assertPuedeDescargarPdf(
    cicloId: string,
    actor: AuthenticatedUser,
  ): Promise<CicloCoaching> {
    const ciclo = await this.findOne(cicloId);
    if (actor.role === Role.COACH) {
      return ciclo;
    }
    if (actor.role === Role.COACHEE) {
      const coachee = await this.coachees.findByUserId(actor.id);
      if (!coachee || coachee.id !== ciclo.coacheeId) {
        throw new ForbiddenException('No tienes acceso a este ciclo.');
      }
      return ciclo;
    }
    // Empresa: reutiliza el scoping ya probado de CoacheesService.
    await this.coachees.findOneForActor(ciclo.coacheeId, actor);
    return ciclo;
  }

  async findAllForCoachee(coacheeId: string): Promise<CicloConEstado[]> {
    const ciclos = await this.ciclos.find({
      where: { coacheeId },
      order: { fechaApertura: 'DESC' },
    });
    return Promise.all(ciclos.map((c) => this.attachEstado(c)));
  }

  async findCurrentForCoachee(
    coacheeId: string,
  ): Promise<CicloConEstado | null> {
    const ciclo = await this.ciclos.findOne({
      where: { coacheeId, fechaCierre: IsNull() },
    });
    return ciclo ? this.attachEstado(ciclo) : null;
  }

  async findAllAbiertosConEstado(): Promise<CicloConEstado[]> {
    const ciclos = await this.ciclos.find({
      where: { fechaCierre: IsNull() },
      relations: { coachee: true },
    });
    return Promise.all(ciclos.map((c) => this.attachEstado(c)));
  }

  async findAllCerradosConEstado(): Promise<CicloConEstado[]> {
    const ciclos = await this.ciclos.find({
      where: { fechaCierre: Not(IsNull()) },
      relations: { coachee: true },
      order: { fechaCierre: 'DESC' },
    });
    return Promise.all(ciclos.map((c) => this.attachEstado(c)));
  }

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return coachee.id;
  }

  async findAllOwn(actorUserId: string): Promise<CicloConEstado[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.findAllForCoachee(coacheeId);
  }

  async findCurrentOwn(actorUserId: string): Promise<CicloConEstado | null> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.findCurrentForCoachee(coacheeId);
  }
}
