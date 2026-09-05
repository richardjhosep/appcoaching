import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Between,
  In,
  IsNull,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
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
import { DisponibilidadCoach } from '../sesiones/entities/disponibilidad-coach.entity';
import { SESION_DURACION_MINUTOS } from '../sesiones/sesiones.constants';
import { CiclosService } from '../ciclos/ciclos.service';
import { SeguimientoService } from '../seguimiento/seguimiento.service';
import { EmailService } from '../email/email.service';
import { EmpresasService } from '../empresas/empresas.service';
import {
  diaYHoraLocalChile,
  fechaSimpleHoyChile,
  finDelDiaChileAUtc,
  inicioDelDiaChileAUtc,
  sumarDiasFechaSimple,
} from '../common/chile-time.util';

const DIAS_SIN_LOGRO_ALERTA = 30;
const DIAS_URGENCIA_CONTRATO = 15;

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

export interface ResumenAcumuladoEmpresa {
  anio: number;
  semestre: 1 | 2;
  gastoEjecutadoSemestre: number;
  gastoAgendadoSemestre: number;
  gastoEjecutadoAnio: number;
  gastoAgendadoAnio: number;
}

export interface ProcesoConRetorno {
  coacheeNombre: string;
  cicloId: string;
  fechaApertura: Date;
  fechaCierre: Date;
  costo: number;
  resultado: ResultadoCiclo;
  impactoNegocio: string | null;
}

export interface RetornoInversionEmpresa {
  costoTotalProcesosCerrados: number;
  costoPromedioPorProceso: number | null;
  distribucionResultados: Record<ResultadoCiclo, number>;
  procesos: ProcesoConRetorno[];
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

export type EstadoCartera =
  | 'sin_fecha'
  | 'vencido'
  | 'vence_este_mes'
  | 'vence_este_semestre'
  | 'vigente';

export interface UltimaGestionCartera {
  nota: string;
  fecha: Date;
  proximoSeguimiento: string | null;
}

export interface EmpresaCartera {
  empresaId: string;
  nombre: string;
  fechaFin: string | null;
  pagada: boolean;
  horasContratadas: number | null;
  horasConsumidasEsteMes: number;
  estado: EstadoCartera;
  diasParaVencer: number | null;
  ultimaGestion: UltimaGestionCartera | null;
}

export interface IndependientePorVencer {
  coacheeId: string;
  nombre: string;
  sesionesRestantes: number;
}

export interface ResumenCartera {
  empresas: EmpresaCartera[];
  independientesPorVencer: IndependientePorVencer[];
}

export interface SesionSinConfirmar {
  sesionId: string;
  coacheeId: string;
  nombre: string;
  fechaHora: Date;
}

export interface ContratoUrgente {
  empresaId: string;
  nombre: string;
  diasParaVencer: number | null;
  ultimaGestion: UltimaGestionCartera | null;
}

export interface PagoPendiente {
  empresaId: string;
  nombre: string;
  gastoDelPeriodo: number;
}

export interface AtencionInmediata {
  sesionesSinConfirmar: SesionSinConfirmar[];
  contratosUrgentes: ContratoUrgente[];
  pagosPendientes: PagoPendiente[];
}

export interface ComparativoYCapacidad {
  ingresoMesActual: number;
  ingresoMesAnterior: number;
  variacionIngresoPct: number | null;
  coachingsIniciadosMesActual: number;
  coachingsIniciadosMesAnterior: number;
  horasComprometidasSemana: number;
  horasDisponiblesSemana: number;
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
    @InjectRepository(DisponibilidadCoach)
    private readonly disponibilidad: Repository<DisponibilidadCoach>,
    private readonly ciclos: CiclosService,
    private readonly seguimiento: SeguimientoService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    private readonly empresasService: EmpresasService,
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

  private estadoCartera(
    fechaFin: string | null,
    hoy: Date,
  ): { estado: EstadoCartera; diasParaVencer: number | null } {
    if (!fechaFin) return { estado: 'sin_fecha', diasParaVencer: null };
    // `fechaFin` es "date" puro (string "YYYY-MM-DD", sin hora) — se compara como
    // medianoche local, no hace falta chile-time.util acá (no es un instante, es una
    // fecha calendario de término de contrato).
    const fin = new Date(`${fechaFin}T00:00:00`);
    const diasParaVencer = Math.round(
      (fin.getTime() - hoy.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (diasParaVencer < 0) return { estado: 'vencido', diasParaVencer };
    if (diasParaVencer <= 30)
      return { estado: 'vence_este_mes', diasParaVencer };
    if (diasParaVencer <= 180) {
      return { estado: 'vence_este_semestre', diasParaVencer };
    }
    return { estado: 'vigente', diasParaVencer };
  }

  /**
   * Cartera de empresas para el dashboard del coach: una sola lista que responde a la
   * vez "qué vence este mes/semestre" y "vista general de cartera" — mismo dato, la UI
   * decide cómo filtrarlo/ordenarlo por urgencia. Los independientes (sin empresa) no
   * tienen un contrato con fecha — se cubren aparte con la señal de sesiones restantes
   * de su ciclo abierto, que ya existe.
   */
  async carteraEmpresas(): Promise<ResumenCartera> {
    const [empresas, cobrosDelMes, ciclosAbiertos, ultimaGestionPorEmpresa] =
      await Promise.all([
        this.empresas.find({
          where: { isActive: true },
          order: { nombre: 'ASC' },
        }),
        this.calcularResumenCobros(),
        this.ciclos.findAllAbiertosConEstado(),
        this.empresasService.ultimaGestionPorEmpresa(),
      ]);
    const consumidasPorEmpresa = new Map(
      cobrosDelMes.porEmpresa.map((e) => [e.empresaId, e.horasConsumidas]),
    );
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const empresasCartera: EmpresaCartera[] = empresas.map((empresa) => {
      const { estado, diasParaVencer } = this.estadoCartera(
        empresa.fechaFin,
        hoy,
      );
      const gestion = ultimaGestionPorEmpresa.get(empresa.id);
      return {
        empresaId: empresa.id,
        nombre: empresa.nombre,
        fechaFin: empresa.fechaFin,
        pagada: empresa.pagada,
        horasContratadas: empresa.horasContratadas,
        horasConsumidasEsteMes: consumidasPorEmpresa.get(empresa.id) ?? 0,
        estado,
        diasParaVencer,
        ultimaGestion: gestion
          ? {
              nota: gestion.nota,
              fecha: gestion.createdAt,
              proximoSeguimiento: gestion.proximoSeguimiento,
            }
          : null,
      };
    });

    const independientesPorVencer: IndependientePorVencer[] = ciclosAbiertos
      .filter((c) => c.alertaPorVencer && !c.coachee?.empresaId)
      .map((c) => ({
        coacheeId: c.coacheeId,
        nombre: c.coachee?.nombre ?? '',
        sesionesRestantes: c.sesionesRestantes,
      }));

    return { empresas: empresasCartera, independientesPorVencer };
  }

  /**
   * "¿Qué necesito hacer hoy?" — se responde antes que cualquier métrica general (principio de
   * UX del requerimiento). Junta 3 señales de urgencia que ya existen por separado
   * (confirmación de sesión, cartera con gestión de renovación, estado de pago) en un solo
   * bloque accionable.
   */
  async atencionInmediata(): Promise<AtencionInmediata> {
    const hoyStr = fechaSimpleHoyChile();
    const mananaStr = sumarDiasFechaSimple(hoyStr, 1);
    const desde = inicioDelDiaChileAUtc(hoyStr);
    const hasta = finDelDiaChileAUtc(mananaStr);

    const [sesionesHoyManana, cartera, cobros] = await Promise.all([
      this.sesiones.find({
        where: { fechaHora: Between(desde, hasta), confirmada: false },
        relations: { coachee: true },
        order: { fechaHora: 'ASC' },
      }),
      this.carteraEmpresas(),
      this.calcularResumenCobros(),
    ]);

    const sesionesSinConfirmar: SesionSinConfirmar[] = sesionesHoyManana.map(
      (s) => ({
        sesionId: s.id,
        coacheeId: s.coacheeId,
        nombre: s.coachee?.nombre ?? '',
        fechaHora: s.fechaHora,
      }),
    );

    // Urgente = vence en menos de DIAS_URGENCIA_CONTRATO días Y no hay una gestión de
    // renovación en curso (sin gestión, o la última quedó con un seguimiento ya pasado).
    const ahora = new Date();
    const contratosUrgentes: ContratoUrgente[] = cartera.empresas
      .filter(
        (e) =>
          e.diasParaVencer !== null &&
          e.diasParaVencer < DIAS_URGENCIA_CONTRATO,
      )
      .filter((e) => {
        const proximo = e.ultimaGestion?.proximoSeguimiento;
        if (!proximo) return true;
        return new Date(`${proximo}T00:00:00`) < ahora;
      })
      .map((e) => ({
        empresaId: e.empresaId,
        nombre: e.nombre,
        diasParaVencer: e.diasParaVencer,
        ultimaGestion: e.ultimaGestion,
      }));

    const gastoPorEmpresa = new Map(
      cobros.porEmpresa.map((e) => [e.empresaId, e.gastoBrutoDelPeriodo]),
    );
    const pagosPendientes: PagoPendiente[] = cartera.empresas
      .filter((e) => !e.pagada)
      .map((e) => ({
        empresaId: e.empresaId,
        nombre: e.nombre,
        gastoDelPeriodo: gastoPorEmpresa.get(e.empresaId) ?? 0,
      }));

    return { sesionesSinConfirmar, contratosUrgentes, pagosPendientes };
  }

  private rangoMesOffset(offsetMeses: number): { inicio: Date; fin: Date } {
    const now = new Date();
    return {
      inicio: new Date(now.getFullYear(), now.getMonth() + offsetMeses, 1),
      fin: new Date(now.getFullYear(), now.getMonth() + offsetMeses + 1, 1),
    };
  }

  // Lunes (00:00 hora Chile) de la semana que contiene "hoy" — mismo criterio que
  // frontend/src/lib/dateRange.ts#inicioDeSemana, pero calculado en el servidor (el proceso
  // corre con TZ=UTC, ver chile-time.util.ts) para no depender de que el cliente lo mande.
  private rangoSemanaActualChile(): { inicio: Date; fin: Date } {
    const hoyStr = fechaSimpleHoyChile();
    const diaSemana = diaYHoraLocalChile(new Date()).diaSemana; // 0=domingo..6=sábado
    const offsetALunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    const lunesStr = sumarDiasFechaSimple(hoyStr, offsetALunes);
    return {
      inicio: inicioDelDiaChileAUtc(lunesStr),
      fin: inicioDelDiaChileAUtc(sumarDiasFechaSimple(lunesStr, 7)),
    };
  }

  private horasDeBloque(horaInicio: string, horaFin: string): number {
    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);
    return (hFin * 60 + mFin - (hIni * 60 + mIni)) / 60;
  }

  /**
   * Comparativo vs. mes anterior (ingreso, coachings iniciados) + carga de trabajo de la
   * semana (horas comprometidas vs. capacidad total del coach) — agrupados en una sola
   * llamada para no sumar más round-trips sueltos al dashboard.
   */
  async comparativoYCapacidad(): Promise<ComparativoYCapacidad> {
    const mesActual = this.mesActualRango();
    const mesAnterior = this.rangoMesOffset(-1);
    const semana = this.rangoSemanaActualChile();

    const [
      cobrosActual,
      cobrosAnterior,
      coachingsIniciadosMesActual,
      coachingsIniciadosMesAnterior,
      sesionesSemana,
      bloquesDisponibilidad,
    ] = await Promise.all([
      this.calcularResumenCobros(mesActual),
      this.calcularResumenCobros(mesAnterior),
      this.ciclosCoaching.count({
        where: { fechaApertura: Between(mesActual.inicio, mesActual.fin) },
      }),
      this.ciclosCoaching.count({
        where: { fechaApertura: Between(mesAnterior.inicio, mesAnterior.fin) },
      }),
      this.sesiones.count({
        where: { fechaHora: Between(semana.inicio, semana.fin) },
      }),
      this.disponibilidad.find(),
    ]);

    const ingresoMesActual = cobrosActual.ingresoDelPeriodoTotal;
    const ingresoMesAnterior = cobrosAnterior.ingresoDelPeriodoTotal;
    const variacionIngresoPct =
      ingresoMesAnterior > 0
        ? Math.round(
            ((ingresoMesActual - ingresoMesAnterior) / ingresoMesAnterior) *
              1000,
          ) / 10
        : null;

    const horasComprometidasSemana =
      Math.round(((sesionesSemana * SESION_DURACION_MINUTOS) / 60) * 10) / 10;
    const horasDisponiblesSemana = bloquesDisponibilidad.reduce(
      (total, bloque) =>
        total + this.horasDeBloque(bloque.horaInicio, bloque.horaFin),
      0,
    );

    return {
      ingresoMesActual,
      ingresoMesAnterior,
      variacionIngresoPct,
      coachingsIniciadosMesActual,
      coachingsIniciadosMesAnterior,
      horasComprometidasSemana,
      horasDisponiblesSemana,
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
   * Gasto acumulado del semestre y del año calendario para UNA empresa — para responder
   * "cuánto llevo gastado" (ejecución de presupuesto), no una proyección. Reutiliza
   * `rangoDePeriodo`/`calcularResumenCobros` con el rango completo del semestre/año: las
   * sesiones ya pasadas caen en `gastoBrutoDelPeriodo` (ejecutado real) y las que ya están
   * agendadas pero todavía no ocurren caen en `gastoBrutoProyectado` (comprometido, no
   * especulativo — a diferencia de una proyección basada en promedio, esto es dinero que
   * ya tiene una sesión concreta agendada).
   */
  async resumenAcumuladoParaEmpresa(
    empresaId: string,
  ): Promise<ResumenAcumuladoEmpresa> {
    const [cobrosSemestre, cobrosAnio] = await Promise.all([
      this.calcularResumenCobros(this.rangoDePeriodo('semestre')),
      this.calcularResumenCobros(this.rangoDePeriodo('anio')),
    ]);
    const empresaSemestre = cobrosSemestre.porEmpresa.find(
      (e) => e.empresaId === empresaId,
    );
    const empresaAnio = cobrosAnio.porEmpresa.find(
      (e) => e.empresaId === empresaId,
    );
    const now = new Date();

    return {
      anio: now.getFullYear(),
      semestre: now.getMonth() < 6 ? 1 : 2,
      gastoEjecutadoSemestre: empresaSemestre?.gastoBrutoDelPeriodo ?? 0,
      gastoAgendadoSemestre: empresaSemestre?.gastoBrutoProyectado ?? 0,
      gastoEjecutadoAnio: empresaAnio?.gastoBrutoDelPeriodo ?? 0,
      gastoAgendadoAnio: empresaAnio?.gastoBrutoProyectado ?? 0,
    };
  }

  /**
   * Cruce honesto entre gasto real y resultado, por cada proceso YA CERRADO de la empresa —
   * no hay puntaje de "impacto" que fabricar (ver `lib/ultimosImpactos.ts` en el frontend, esa
   * decisión ya se tomó), pero el costo (sesiones realizadas × tarifa) y el `resultado`
   * categórico sí son datos reales y agregables. Sin filtro de período: la cantidad de ciclos
   * cerrados por empresa es chica, y es justo el historial completo lo que un subgerente
   * necesita para evaluar el programa.
   */
  async retornoParaEmpresa(
    empresaId: string,
  ): Promise<RetornoInversionEmpresa> {
    const vacio: RetornoInversionEmpresa = {
      costoTotalProcesosCerrados: 0,
      costoPromedioPorProceso: null,
      distribucionResultados: {
        [ResultadoCiclo.LOGRADO]: 0,
        [ResultadoCiclo.MEDIANAMENTE_LOGRADO]: 0,
        [ResultadoCiclo.NO_LOGRADO]: 0,
      },
      procesos: [],
    };

    const coacheesEmpresa = await this.coachees.find({
      where: { empresaId },
      relations: { empresa: true },
    });
    if (coacheesEmpresa.length === 0) return vacio;
    const coacheeMap = new Map(coacheesEmpresa.map((c) => [c.id, c]));

    const ciclosCerrados = await this.ciclosCoaching.find({
      where: {
        coacheeId: In([...coacheeMap.keys()]),
        fechaCierre: Not(IsNull()),
      },
      order: { fechaCierre: 'DESC' },
    });
    if (ciclosCerrados.length === 0) return vacio;

    const sesionesDeCiclos = await this.sesiones.find({
      where: { cicloId: In(ciclosCerrados.map((c) => c.id)) },
    });
    const now = new Date();
    const sesionesRealizadasPorCiclo = new Map<string, number>();
    for (const sesion of sesionesDeCiclos) {
      if (!sesion.cicloId || sesion.fechaHora > now) continue;
      sesionesRealizadasPorCiclo.set(
        sesion.cicloId,
        (sesionesRealizadasPorCiclo.get(sesion.cicloId) ?? 0) + 1,
      );
    }

    const distribucionResultados = { ...vacio.distribucionResultados };
    let costoTotalProcesosCerrados = 0;

    const procesos: ProcesoConRetorno[] = ciclosCerrados.map((ciclo) => {
      const coachee = coacheeMap.get(ciclo.coacheeId)!;
      const tarifa = this.tarifaEfectiva(coachee);
      const sesionesRealizadas = sesionesRealizadasPorCiclo.get(ciclo.id) ?? 0;
      const costo = sesionesRealizadas * tarifa;
      costoTotalProcesosCerrados += costo;
      distribucionResultados[ciclo.resultado!] += 1;

      return {
        coacheeNombre: coachee.nombre,
        cicloId: ciclo.id,
        fechaApertura: ciclo.fechaApertura,
        fechaCierre: ciclo.fechaCierre!,
        costo,
        resultado: ciclo.resultado!,
        impactoNegocio: ciclo.impactoNegocio,
      };
    });

    return {
      costoTotalProcesosCerrados,
      costoPromedioPorProceso: Math.round(
        costoTotalProcesosCerrados / procesos.length,
      ),
      distribucionResultados,
      procesos,
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
