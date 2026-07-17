import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { CicloCoaching } from './entities/ciclo-coaching.entity';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { AbrirCicloDto } from './dto/abrir-ciclo.dto';
import { ResultadoCiclo } from './enums/resultado-ciclo.enum';
import { CoacheesService } from '../coachees/coachees.service';
import { PlanesDesarrolloService } from '../planes-desarrollo/planes-desarrollo.service';
import { SeguimientoService } from '../seguimiento/seguimiento.service';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

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
      throw new NotFoundException('Ciclo not found');
    }
    return ciclo;
  }

  async findOneWithEstado(id: string): Promise<CicloConEstado> {
    return this.attachEstado(await this.findOne(id));
  }

  async abrir(dto: AbrirCicloDto): Promise<CicloConEstado> {
    if (!(await this.coachees.exists(dto.coacheeId))) {
      throw new NotFoundException('Coachee not found');
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

  async generarBorradorInforme(id: string): Promise<CicloConEstado> {
    const ciclo = await this.findOne(id);
    const conEstado = await this.attachEstado(ciclo);

    let objetivosTexto = 'Sin plan de desarrollo definido.';
    let competenciaTexto = '—';
    try {
      const plan = await this.planesDesarrollo.getByCoacheeId(ciclo.coacheeId);
      competenciaTexto = plan.objetivoGeneral ?? '—';
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

    const informe = [
      `Informe final del ciclo de coaching`,
      `Período: ${ciclo.fechaApertura.toISOString().slice(0, 10)} — ${
        ciclo.fechaCierre
          ? ciclo.fechaCierre.toISOString().slice(0, 10)
          : 'en curso'
      }`,
      '',
      `Objetivo general: ${competenciaTexto}`,
      '',
      'Objetivos específicos trabajados:',
      objetivosTexto,
      '',
      `Sesiones realizadas: ${conEstado.sesionesRealizadas} de ${ciclo.totalSesiones} contratadas.`,
      `Avance general autoevaluado: ${avance !== null ? `${avance}%` : 'sin autoevaluación registrada'}.`,
    ].join('\n');

    return this.updateInformeFinal(id, informe);
  }

  async uploadInformePdf(
    id: string,
    archivo: { originalname: string; filename: string },
  ): Promise<CicloConEstado> {
    const ciclo = await this.findOne(id);
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
        throw new ForbiddenException();
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

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
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
