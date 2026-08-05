import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { PostSesion } from '../sesiones/entities/post-sesion.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { Logro } from '../seguimiento/entities/logro.entity';
import { SolicitudProceso } from '../satisfaccion/entities/solicitud-proceso.entity';
import { EstadoSolicitudProceso } from '../satisfaccion/enums/estado-solicitud-proceso.enum';
import { SolicitudReagendamiento } from '../sesiones/entities/solicitud-reagendamiento.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { ResultadoCiclo } from '../ciclos/enums/resultado-ciclo.enum';
import { CiclosService } from '../ciclos/ciclos.service';
import { SeguimientoService } from '../seguimiento/seguimiento.service';

const DIAS_SIN_LOGRO_ALERTA = 30;

export type PeriodoComercial = 'mes' | 'semestre' | 'anio';

export interface EmpresaCobro {
  empresaId: string;
  nombre: string;
  pagada: boolean;
  horasContratadas: number | null;
  horasConsumidas: number;
  ingresoDelPeriodo: number;
  ingresoProyectado: number;
}

export interface CoacheeCobro {
  coacheeId: string;
  nombre: string;
  empresaNombre: string | null;
  horasRealizadas: number;
  ingresoDelPeriodo: number;
  ingresoProyectado: number;
}

export interface ResumenCobros {
  porEmpresa: EmpresaCobro[];
  porCoachee: CoacheeCobro[];
  horasRealizadasTotal: number;
  ingresoDelPeriodoTotal: number;
  ingresoProyectadoTotal: number;
}

export interface ContribuyenteMes {
  nombre: string;
  monto: number;
}

export interface ProyeccionMes {
  mes: string;
  etiqueta: string;
  total: number;
  porEmpresa: ContribuyenteMes[];
  porCoachee: ContribuyenteMes[];
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

export interface ResumenComercial {
  periodo: PeriodoComercial;
  ingresoDelPeriodo: number;
  ingresoProyectado: number;
  horasRealizadas: number;
  solicitudesNuevas: number;
  solicitudesAtendidas: number;
  solicitudesPendientes: number;
  procesosIniciados: number;
  procesosCerrados: number;
  procesosCerradosPorResultado: Record<ResultadoCiclo, number>;
  reagendamientosSolicitados: number;
  porCoachee: CoacheeCobro[];
}

@Injectable()
export class NegocioService {
  constructor(
    @InjectRepository(Sesion) private readonly sesiones: Repository<Sesion>,
    @InjectRepository(PostSesion)
    private readonly postSesiones: Repository<PostSesion>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(Coachee) private readonly coachees: Repository<Coachee>,
    @InjectRepository(Logro) private readonly logros: Repository<Logro>,
    @InjectRepository(SolicitudProceso)
    private readonly solicitudesProceso: Repository<SolicitudProceso>,
    @InjectRepository(SolicitudReagendamiento)
    private readonly solicitudesReagendamiento: Repository<SolicitudReagendamiento>,
    @InjectRepository(CicloCoaching)
    private readonly ciclosCoaching: Repository<CicloCoaching>,
    private readonly ciclos: CiclosService,
    private readonly seguimiento: SeguimientoService,
  ) {}

  private tarifaEfectiva(coachee: Coachee): number {
    return coachee.tarifaPropia ?? coachee.empresa?.tarifaHora ?? 0;
  }

  private mesActualRango(): { inicio: Date; fin: Date } {
    const now = new Date();
    return {
      inicio: new Date(now.getFullYear(), now.getMonth(), 1),
      fin: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  /** Rango de fechas [inicio, fin) para cada período comercial seleccionable. */
  rangoDePeriodo(periodo: PeriodoComercial): { inicio: Date; fin: Date } {
    const now = new Date();
    const year = now.getFullYear();
    if (periodo === 'mes') return this.mesActualRango();
    if (periodo === 'semestre') {
      const esPrimerSemestre = now.getMonth() < 6;
      return {
        inicio: new Date(year, esPrimerSemestre ? 0 : 6, 1),
        fin: new Date(year, esPrimerSemestre ? 6 : 12, 1),
      };
    }
    return { inicio: new Date(year, 0, 1), fin: new Date(year + 1, 0, 1) };
  }

  /**
   * Única función que calcula cobros/horas del período — reutilizada tanto por
   * el panel de negocio como por cualquier otra vista que necesite las mismas
   * cifras, para que nunca se muestren números distintos entre pantallas.
   */
  async calcularResumenCobros(
    rango: { inicio: Date; fin: Date } = this.mesActualRango(),
  ): Promise<ResumenCobros> {
    const { inicio, fin } = rango;
    const now = new Date();

    const [coachees, sesionesDelMes, empresas] = await Promise.all([
      this.coachees.find({ relations: { empresa: true } }),
      this.sesiones.find({ where: { fechaHora: Between(inicio, fin) } }),
      this.empresas.find({ order: { nombre: 'ASC' } }),
    ]);
    const coacheeMap = new Map(coachees.map((c) => [c.id, c]));

    let horasRealizadasTotal = 0;
    let ingresoDelPeriodoTotal = 0;
    let ingresoProyectadoTotal = 0;
    const porEmpresaMap = new Map<
      string,
      {
        horasConsumidas: number;
        ingresoDelPeriodo: number;
        ingresoProyectado: number;
      }
    >();
    const porCoacheeMap = new Map<
      string,
      {
        horasRealizadas: number;
        ingresoDelPeriodo: number;
        ingresoProyectado: number;
      }
    >();

    for (const sesion of sesionesDelMes) {
      const coachee = coacheeMap.get(sesion.coacheeId);
      if (!coachee) continue;

      const tarifa = this.tarifaEfectiva(coachee);
      const realizada = sesion.fechaHora <= now;
      // Un coachee independiente (sin empresa) siempre paga directamente al coach;
      // solo el ingreso ligado a una empresa se condiciona a que esté marcada como pagada.
      const cuentaParaIngreso = coachee.empresaId
        ? (coachee.empresa?.pagada ?? false)
        : true;

      if (realizada) {
        horasRealizadasTotal += 1;
        if (cuentaParaIngreso) ingresoDelPeriodoTotal += tarifa;
      } else if (cuentaParaIngreso) {
        ingresoProyectadoTotal += tarifa;
      }

      if (coachee.empresaId) {
        const bucket = porEmpresaMap.get(coachee.empresaId) ?? {
          horasConsumidas: 0,
          ingresoDelPeriodo: 0,
          ingresoProyectado: 0,
        };
        if (realizada) {
          bucket.horasConsumidas += 1;
          if (coachee.empresa?.pagada) bucket.ingresoDelPeriodo += tarifa;
        } else if (coachee.empresa?.pagada) {
          bucket.ingresoProyectado += tarifa;
        }
        porEmpresaMap.set(coachee.empresaId, bucket);
      }

      if (cuentaParaIngreso) {
        const bucket = porCoacheeMap.get(coachee.id) ?? {
          horasRealizadas: 0,
          ingresoDelPeriodo: 0,
          ingresoProyectado: 0,
        };
        if (realizada) {
          bucket.horasRealizadas += 1;
          bucket.ingresoDelPeriodo += tarifa;
        } else {
          bucket.ingresoProyectado += tarifa;
        }
        porCoacheeMap.set(coachee.id, bucket);
      }
    }

    const porEmpresa: EmpresaCobro[] = empresas.map((empresa) => {
      const datos = porEmpresaMap.get(empresa.id) ?? {
        horasConsumidas: 0,
        ingresoDelPeriodo: 0,
        ingresoProyectado: 0,
      };
      return {
        empresaId: empresa.id,
        nombre: empresa.nombre,
        pagada: empresa.pagada,
        horasContratadas: empresa.horasContratadas,
        ...datos,
      };
    });

    // Solo coachees con actividad real o proyectada en el período — a diferencia de
    // `porEmpresa` (lista corta y estable), la lista de coachees crece indefinidamente con el
    // tiempo y mostrar filas en $0 no ayuda a decidir nada.
    const porCoachee: CoacheeCobro[] = [...porCoacheeMap.entries()]
      .map(([coacheeId, datos]) => {
        const coachee = coacheeMap.get(coacheeId)!;
        return {
          coacheeId,
          nombre: coachee.nombre,
          empresaNombre: coachee.empresa?.nombre ?? null,
          ...datos,
        };
      })
      .sort(
        (a, b) =>
          b.ingresoDelPeriodo +
          b.ingresoProyectado -
          (a.ingresoDelPeriodo + a.ingresoProyectado),
      );

    return {
      porEmpresa,
      porCoachee,
      horasRealizadasTotal,
      ingresoDelPeriodoTotal,
      ingresoProyectadoTotal,
    };
  }

  /**
   * Actividad del embudo comercial (solicitudes, procesos iniciados/cerrados, reagendamientos)
   * más ingreso/horas del mismo cálculo de `calcularResumenCobros`, para un período seleccionable
   * — a diferencia de `resumenNegocio()`, que siempre es del mes calendario actual.
   */
  async resumenComercial(periodo: PeriodoComercial): Promise<ResumenComercial> {
    const rango = this.rangoDePeriodo(periodo);
    const rangoFechas = Between(rango.inicio, rango.fin);

    const [
      cobros,
      solicitudes,
      procesosIniciados,
      procesosCerrados,
      reagendamientos,
    ] = await Promise.all([
      this.calcularResumenCobros(rango),
      this.solicitudesProceso.find({ where: { createdAt: rangoFechas } }),
      this.ciclosCoaching.count({ where: { fechaApertura: rangoFechas } }),
      this.ciclosCoaching.find({ where: { fechaCierre: rangoFechas } }),
      this.solicitudesReagendamiento.count({
        where: { createdAt: rangoFechas },
      }),
    ]);

    const porResultado: Record<ResultadoCiclo, number> = {
      [ResultadoCiclo.LOGRADO]: 0,
      [ResultadoCiclo.MEDIANAMENTE_LOGRADO]: 0,
      [ResultadoCiclo.NO_LOGRADO]: 0,
    };
    for (const ciclo of procesosCerrados) {
      if (ciclo.resultado) porResultado[ciclo.resultado] += 1;
    }

    const solicitudesAtendidas = solicitudes.filter(
      (s) => s.estado === EstadoSolicitudProceso.ATENDIDA,
    ).length;

    return {
      periodo,
      ingresoDelPeriodo: cobros.ingresoDelPeriodoTotal,
      ingresoProyectado: cobros.ingresoProyectadoTotal,
      horasRealizadas: cobros.horasRealizadasTotal,
      solicitudesNuevas: solicitudes.length,
      solicitudesAtendidas,
      solicitudesPendientes: solicitudes.length - solicitudesAtendidas,
      procesosIniciados,
      procesosCerrados: procesosCerrados.length,
      procesosCerradosPorResultado: porResultado,
      reagendamientosSolicitados: reagendamientos,
      porCoachee: cobros.porCoachee,
    };
  }

  /**
   * Proyección rodante de 12 meses calendario, empezando en el mes actual — reutiliza
   * `calcularResumenCobros` mes a mes en vez de duplicar la lógica de tarifa efectiva /
   * pagada / confirmado-vs-proyectado.
   */
  async proyeccionMensual(): Promise<ProyeccionMes[]> {
    const now = new Date();
    const rangos = Array.from({ length: 12 }, (_, i) => ({
      inicio: new Date(now.getFullYear(), now.getMonth() + i, 1),
      fin: new Date(now.getFullYear(), now.getMonth() + i + 1, 1),
    }));

    const cobrosPorMes = await Promise.all(
      rangos.map((rango) => this.calcularResumenCobros(rango)),
    );

    return rangos.map((rango, i) => {
      const cobros = cobrosPorMes[i];
      return {
        mes: `${rango.inicio.getFullYear()}-${String(rango.inicio.getMonth() + 1).padStart(2, '0')}`,
        etiqueta: `${MESES_ABREV[rango.inicio.getMonth()]} '${String(rango.inicio.getFullYear()).slice(2)}`,
        total: cobros.ingresoDelPeriodoTotal + cobros.ingresoProyectadoTotal,
        porEmpresa: cobros.porEmpresa
          .map((e) => ({
            nombre: e.nombre,
            monto: e.ingresoDelPeriodo + e.ingresoProyectado,
          }))
          .filter((e) => e.monto > 0)
          .sort((a, b) => b.monto - a.monto),
        porCoachee: cobros.porCoachee
          .map((c) => ({
            nombre: c.nombre,
            monto: c.ingresoDelPeriodo + c.ingresoProyectado,
          }))
          .sort((a, b) => b.monto - a.monto),
      };
    });
  }

  async resumenNegocio() {
    const [cobros, ciclosAbiertos, satisfaccion] = await Promise.all([
      this.calcularResumenCobros(),
      this.ciclos.findAllAbiertosConEstado(),
      this.postSesiones
        .createQueryBuilder('post')
        .select('AVG(post.utilidad)', 'avg')
        .where('post.publicada = true')
        .getRawOne<{ avg: string | null }>(),
    ]);

    return {
      ...cobros,
      coacheesActivos: ciclosAbiertos.length,
      satisfaccionPromedio: satisfaccion?.avg
        ? Math.round(Number(satisfaccion.avg) * 10) / 10
        : null,
    };
  }

  async alertasSeguimiento() {
    const ciclosAbiertos = await this.ciclos.findAllAbiertosConEstado();
    const desde = new Date(
      Date.now() - DIAS_SIN_LOGRO_ALERTA * 24 * 60 * 60 * 1000,
    );
    const now = new Date();

    const ciclosPorVencer = ciclosAbiertos
      .filter((c) => c.alertaPorVencer)
      .map((c) => ({
        coacheeId: c.coacheeId,
        nombre: c.coachee?.nombre ?? '',
        sesionesRestantes: c.sesionesRestantes,
      }));

    const [coacheesSinLogros, coacheesSinProximaSesion] = await Promise.all([
      Promise.all(
        ciclosAbiertos.map(async (c) => {
          const tieneLogro = await this.logros.exists({
            where: {
              coacheeId: c.coacheeId,
              createdAt: MoreThanOrEqual(desde),
            },
          });
          return tieneLogro
            ? null
            : { coacheeId: c.coacheeId, nombre: c.coachee?.nombre ?? '' };
        }),
      ),
      Promise.all(
        ciclosAbiertos.map(async (c) => {
          const tieneProxima = await this.sesiones.exists({
            where: { coacheeId: c.coacheeId, fechaHora: MoreThan(now) },
          });
          return tieneProxima
            ? null
            : { coacheeId: c.coacheeId, nombre: c.coachee?.nombre ?? '' };
        }),
      ),
    ]);

    return {
      ciclosPorVencer,
      coacheesSinLogros: coacheesSinLogros.filter((x) => x !== null),
      coacheesSinProximaSesion: coacheesSinProximaSesion.filter(
        (x) => x !== null,
      ),
    };
  }

  async avancePorArea() {
    const coachees = await this.coachees.find();
    const conAvance = await Promise.all(
      coachees.map(async (c) => ({
        area: c.areaGerencia ?? 'Sin área asignada',
        avance: await this.seguimiento.avanceGeneralForCoachee(c.id),
      })),
    );

    const grupos = new Map<string, number[]>();
    for (const { area, avance } of conAvance) {
      if (avance === null) continue;
      const lista = grupos.get(area) ?? [];
      lista.push(avance);
      grupos.set(area, lista);
    }

    return Array.from(grupos.entries())
      .map(([area, valores]) => ({
        area,
        avancePromedio:
          Math.round(
            (valores.reduce((a, b) => a + b, 0) / valores.length) * 10,
          ) / 10,
        coacheesCount: valores.length,
      }))
      .sort((a, b) => b.avancePromedio - a.avancePromedio);
  }
}
