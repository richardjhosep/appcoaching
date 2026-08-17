import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
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
import { EmailService } from '../email/email.service';

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
  // Mismo cálculo que ingresoDelPeriodo/ingresoProyectado pero sin el gate de `pagada` —
  // lo que la empresa realmente gastó, independiente de si el coach ya concilió el cobro
  // en su propio panel. Usado por la vista de empresa, no por el panel del coach.
  gastoBrutoDelPeriodo: number;
  gastoBrutoProyectado: number;
}

export interface CoacheeCobro {
  coacheeId: string;
  nombre: string;
  empresaNombre: string | null;
  horasRealizadas: number;
  ingresoDelPeriodo: number;
  ingresoProyectado: number;
}

// Gasto real por coachee, sin el gate de `pagada` — a diferencia de `porCoachee` (que solo
// incluye coachees "facturables" hoy), esta lista incluye a TODOS los coachees con actividad
// en el período, incluidos los de una empresa que el coach todavía no marcó como pagada.
export interface CoacheeGastoBruto {
  coacheeId: string;
  nombre: string;
  empresaNombre: string | null;
  horasRealizadas: number;
  gastoBrutoDelPeriodo: number;
  gastoBrutoProyectado: number;
}

export interface ResumenCobros {
  porEmpresa: EmpresaCobro[];
  porCoachee: CoacheeCobro[];
  porCoacheeGastoBruto: CoacheeGastoBruto[];
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

export interface ResumenFinanzasEmpresa {
  pagada: boolean;
  horasContratadas: number | null;
  horasConsumidas: number;
  gastoDelPeriodo: number;
  gastoProyectado: number;
  gastoPendiente: number;
  porCoachee: CoacheeGastoBruto[];
}

export interface ProyeccionMesEmpresa {
  mes: string;
  etiqueta: string;
  total: number;
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
    private readonly email: EmailService,
    private readonly config: ConfigService,
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
        gastoBrutoDelPeriodo: number;
        gastoBrutoProyectado: number;
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
    // Espejo de porCoacheeMap pero sin el gate de `pagada` — ver comentario en
    // CoacheeGastoBruto. Se mantiene aparte para no alterar en absoluto qué filas/valores
    // devuelve porCoachee hoy (usado por el panel del coach, ya probado).
    const porCoacheeGastoBrutoMap = new Map<
      string,
      {
        horasRealizadas: number;
        gastoBrutoDelPeriodo: number;
        gastoBrutoProyectado: number;
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
          gastoBrutoDelPeriodo: 0,
          gastoBrutoProyectado: 0,
        };
        if (realizada) {
          bucket.horasConsumidas += 1;
          bucket.gastoBrutoDelPeriodo += tarifa;
          if (coachee.empresa?.pagada) bucket.ingresoDelPeriodo += tarifa;
        } else {
          bucket.gastoBrutoProyectado += tarifa;
          if (coachee.empresa?.pagada) bucket.ingresoProyectado += tarifa;
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

      const gastoBucket = porCoacheeGastoBrutoMap.get(coachee.id) ?? {
        horasRealizadas: 0,
        gastoBrutoDelPeriodo: 0,
        gastoBrutoProyectado: 0,
      };
      if (realizada) {
        gastoBucket.horasRealizadas += 1;
        gastoBucket.gastoBrutoDelPeriodo += tarifa;
      } else {
        gastoBucket.gastoBrutoProyectado += tarifa;
      }
      porCoacheeGastoBrutoMap.set(coachee.id, gastoBucket);
    }

    const porEmpresa: EmpresaCobro[] = empresas.map((empresa) => {
      const datos = porEmpresaMap.get(empresa.id) ?? {
        horasConsumidas: 0,
        ingresoDelPeriodo: 0,
        ingresoProyectado: 0,
        gastoBrutoDelPeriodo: 0,
        gastoBrutoProyectado: 0,
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

    const porCoacheeGastoBruto: CoacheeGastoBruto[] = [
      ...porCoacheeGastoBrutoMap.entries(),
    ]
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
          b.gastoBrutoDelPeriodo +
          b.gastoBrutoProyectado -
          (a.gastoBrutoDelPeriodo + a.gastoBrutoProyectado),
      );

    return {
      porEmpresa,
      porCoachee,
      porCoacheeGastoBruto,
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

  private rangosMensuales(cantidad: number): { inicio: Date; fin: Date }[] {
    const now = new Date();
    return Array.from({ length: cantidad }, (_, i) => ({
      inicio: new Date(now.getFullYear(), now.getMonth() + i, 1),
      fin: new Date(now.getFullYear(), now.getMonth() + i + 1, 1),
    }));
  }

  private etiquetaMes(inicio: Date): { mes: string; etiqueta: string } {
    return {
      mes: `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`,
      etiqueta: `${MESES_ABREV[inicio.getMonth()]} '${String(inicio.getFullYear()).slice(2)}`,
    };
  }

  /**
   * `calcularResumenCobros` corrido mes a mes sobre una ventana rodante — compartido por
   * `proyeccionMensual` (12 meses, todas las empresas) y `proyeccionParaEmpresa` (6 meses,
   * una sola empresa), para no duplicar la lógica de tarifa efectiva/pagada/proyectado.
   */
  private async cobrosPorMeses(
    cantidad: number,
  ): Promise<{ rango: { inicio: Date; fin: Date }; cobros: ResumenCobros }[]> {
    const rangos = this.rangosMensuales(cantidad);
    const cobrosPorMes = await Promise.all(
      rangos.map((rango) => this.calcularResumenCobros(rango)),
    );
    return rangos.map((rango, i) => ({ rango, cobros: cobrosPorMes[i] }));
  }

  /**
   * Proyección rodante de 12 meses calendario, empezando en el mes actual — todas las
   * empresas/coachees, para el panel del coach.
   */
  async proyeccionMensual(): Promise<ProyeccionMes[]> {
    const datos = await this.cobrosPorMeses(12);
    return datos.map(({ rango, cobros }) => ({
      ...this.etiquetaMes(rango.inicio),
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
    }));
  }

  /**
   * Resumen financiero del mes actual para UNA empresa (rol EMPRESA) — usa los campos
   * `gastoBruto*` (sin gate de `pagada`) para que "cuánto gasté" sea honesto incluso si el
   * coach todavía no marcó la empresa como pagada en su propio panel.
   */
  async resumenParaEmpresa(empresaId: string): Promise<ResumenFinanzasEmpresa> {
    const [cobros, coacheesEmpresa] = await Promise.all([
      this.calcularResumenCobros(),
      this.coachees.find({ where: { empresaId } }),
    ]);
    const empresaCobro = cobros.porEmpresa.find(
      (e) => e.empresaId === empresaId,
    );
    const coacheeIds = new Set(coacheesEmpresa.map((c) => c.id));
    const gastoDelPeriodo = empresaCobro?.gastoBrutoDelPeriodo ?? 0;
    const pagada = empresaCobro?.pagada ?? false;

    return {
      pagada,
      horasContratadas: empresaCobro?.horasContratadas ?? null,
      horasConsumidas: empresaCobro?.horasConsumidas ?? 0,
      gastoDelPeriodo,
      gastoProyectado: empresaCobro?.gastoBrutoProyectado ?? 0,
      gastoPendiente: pagada ? 0 : gastoDelPeriodo,
      porCoachee: cobros.porCoacheeGastoBruto.filter((c) =>
        coacheeIds.has(c.coacheeId),
      ),
    };
  }

  /**
   * Proyección rodante de 6 meses para UNA empresa — nunca incluye `porEmpresa` (evitaría
   * filtrar nombres de otras empresas del coach a un cliente).
   */
  async proyeccionParaEmpresa(
    empresaId: string,
  ): Promise<ProyeccionMesEmpresa[]> {
    const [datos, coacheesEmpresa] = await Promise.all([
      this.cobrosPorMeses(6),
      this.coachees.find({ where: { empresaId } }),
    ]);
    const coacheeIds = new Set(coacheesEmpresa.map((c) => c.id));

    return datos.map(({ rango, cobros }) => {
      const empresaCobro = cobros.porEmpresa.find(
        (e) => e.empresaId === empresaId,
      );
      return {
        ...this.etiquetaMes(rango.inicio),
        total:
          (empresaCobro?.gastoBrutoDelPeriodo ?? 0) +
          (empresaCobro?.gastoBrutoProyectado ?? 0),
        porCoachee: cobros.porCoacheeGastoBruto
          .filter((c) => coacheeIds.has(c.coacheeId))
          .map((c) => ({
            nombre: c.nombre,
            monto: c.gastoBrutoDelPeriodo + c.gastoBrutoProyectado,
          }))
          .sort((a, b) => b.monto - a.monto),
      };
    });
  }

  async resumenNegocio() {
    // "Coachees activos" = cartera activa (coachee.activo, el mismo toggle del
    // mantenedor) — NO "con ciclo abierto". Antes usaba ese conteo más angosto, lo que
    // producía el número quedara por debajo de "coachees que necesitan algo" (esa lista
    // sí incluye coachees sin ciclo abierto, ej. con el plan sin enviar): un coachee recién
    // creado, sin ciclo todavía, parecía "no contar" pese a seguir activo en la cartera.
    const [cobros, coacheesActivos, satisfaccion] = await Promise.all([
      this.calcularResumenCobros(),
      this.coachees.count({ where: { activo: true } }),
      this.postSesiones
        .createQueryBuilder('post')
        .select('AVG(post.utilidad)', 'avg')
        .where('post.publicada = true')
        .getRawOne<{ avg: string | null }>(),
    ]);

    return {
      ...cobros,
      coacheesActivos,
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

  private async coacheeConEmail(coacheeId: string): Promise<Coachee> {
    const coachee = await this.coachees.findOne({
      where: { id: coacheeId },
      relations: { user: true },
    });
    if (!coachee?.user?.email) {
      throw new NotFoundException(
        'Este coachee no tiene una cuenta con correo asociada.',
      );
    }
    return coachee;
  }

  async enviarRecordatorioSesion(coacheeId: string): Promise<void> {
    const coachee = await this.coacheeConEmail(coacheeId);
    const verUrl = `${this.config.get<string>('frontendUrl')}/coachee/sesiones`;
    await this.email.sendRecordatorioSesion({
      to: coachee.user!.email,
      nombreCoachee: coachee.nombre,
      verUrl,
    });
  }

  async enviarRecordatorioLogro(coacheeId: string): Promise<void> {
    const coachee = await this.coacheeConEmail(coacheeId);
    const verUrl = `${this.config.get<string>('frontendUrl')}/coachee/progreso`;
    await this.email.sendRecordatorioLogro({
      to: coachee.user!.email,
      nombreCoachee: coachee.nombre,
      verUrl,
    });
  }
}
