import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { PostSesion } from '../sesiones/entities/post-sesion.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { Logro } from '../seguimiento/entities/logro.entity';
import { CiclosService } from '../ciclos/ciclos.service';
import { SeguimientoService } from '../seguimiento/seguimiento.service';

const DIAS_SIN_LOGRO_ALERTA = 30;

export interface EmpresaCobro {
  empresaId: string;
  nombre: string;
  pagada: boolean;
  horasContratadas: number | null;
  horasConsumidas: number;
  ingresoDelPeriodo: number;
  ingresoProyectado: number;
}

export interface ResumenCobros {
  porEmpresa: EmpresaCobro[];
  horasRealizadasTotal: number;
  ingresoDelPeriodoTotal: number;
  ingresoProyectadoTotal: number;
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

  /**
   * Única función que calcula cobros/horas del período — reutilizada tanto por
   * el panel de negocio como por cualquier otra vista que necesite las mismas
   * cifras, para que nunca se muestren números distintos entre pantallas.
   */
  async calcularResumenCobros(): Promise<ResumenCobros> {
    const { inicio, fin } = this.mesActualRango();
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

    return {
      porEmpresa,
      horasRealizadasTotal,
      ingresoDelPeriodoTotal,
      ingresoProyectadoTotal,
    };
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
