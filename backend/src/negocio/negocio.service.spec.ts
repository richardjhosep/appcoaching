import { Repository } from 'typeorm';
import { NegocioService } from './negocio.service';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { PostSesion } from '../sesiones/entities/post-sesion.entity';
import { SolicitudReagendamiento } from '../sesiones/entities/solicitud-reagendamiento.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { Logro } from '../seguimiento/entities/logro.entity';
import { SolicitudProceso } from '../satisfaccion/entities/solicitud-proceso.entity';
import { EstadoSolicitudProceso } from '../satisfaccion/enums/estado-solicitud-proceso.enum';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { ResultadoCiclo } from '../ciclos/enums/resultado-ciclo.enum';
import { CiclosService } from '../ciclos/ciclos.service';
import { SeguimientoService } from '../seguimiento/seguimiento.service';

function makeAvgQueryBuilder(avg: string | null) {
  const qb: Record<string, jest.Mock> = {};
  qb.select = jest.fn(() => qb);
  qb.where = jest.fn(() => qb);
  qb.getRawOne = jest.fn(() => Promise.resolve({ avg }));
  return qb;
}

describe('NegocioService', () => {
  let service: NegocioService;
  let sesionesRepo: {
    find: jest.Mock;
    exists: jest.Mock;
  };
  let postSesionesRepo: { createQueryBuilder: jest.Mock };
  let empresasRepo: { find: jest.Mock };
  let coacheesRepo: { find: jest.Mock };
  let logrosRepo: { exists: jest.Mock };
  let solicitudesProcesoRepo: { find: jest.Mock };
  let solicitudesReagendamientoRepo: { count: jest.Mock };
  let ciclosCoachingRepo: { count: jest.Mock; find: jest.Mock };
  let ciclosService: { findAllAbiertosConEstado: jest.Mock };
  let seguimiento: { avanceGeneralForCoachee: jest.Mock };

  const hace1h = new Date(Date.now() - 60 * 60 * 1000);
  const en1h = new Date(Date.now() + 60 * 60 * 1000);

  beforeEach(() => {
    sesionesRepo = { find: jest.fn().mockResolvedValue([]), exists: jest.fn() };
    postSesionesRepo = {
      createQueryBuilder: jest.fn(() => makeAvgQueryBuilder(null)),
    };
    empresasRepo = { find: jest.fn().mockResolvedValue([]) };
    coacheesRepo = { find: jest.fn().mockResolvedValue([]) };
    logrosRepo = { exists: jest.fn() };
    solicitudesProcesoRepo = { find: jest.fn().mockResolvedValue([]) };
    solicitudesReagendamientoRepo = { count: jest.fn().mockResolvedValue(0) };
    ciclosCoachingRepo = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
    };
    ciclosService = {
      findAllAbiertosConEstado: jest.fn().mockResolvedValue([]),
    };
    seguimiento = { avanceGeneralForCoachee: jest.fn() };

    service = new NegocioService(
      sesionesRepo as unknown as Repository<Sesion>,
      postSesionesRepo as unknown as Repository<PostSesion>,
      empresasRepo as unknown as Repository<Empresa>,
      coacheesRepo as unknown as Repository<Coachee>,
      logrosRepo as unknown as Repository<Logro>,
      solicitudesProcesoRepo as unknown as Repository<SolicitudProceso>,
      solicitudesReagendamientoRepo as unknown as Repository<SolicitudReagendamiento>,
      ciclosCoachingRepo as unknown as Repository<CicloCoaching>,
      ciclosService as unknown as CiclosService,
      seguimiento as unknown as SeguimientoService,
    );
  });

  describe('calcularResumenCobros', () => {
    it('uses tarifaPropia over the empresa rate when the coachee has one', async () => {
      const coachee = {
        id: 'c1',
        empresaId: 'e1',
        tarifaPropia: 50000,
        empresa: {
          id: 'e1',
          nombre: 'Empresa A',
          tarifaHora: 30000,
          pagada: true,
        },
      };
      coacheesRepo.find.mockResolvedValue([coachee]);
      empresasRepo.find.mockResolvedValue([coachee.empresa]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
      ]);

      const resumen = await service.calcularResumenCobros();

      expect(resumen.ingresoDelPeriodoTotal).toBe(50000);
      expect(resumen.porEmpresa[0].ingresoDelPeriodo).toBe(50000);
    });

    it('always counts an independent coachee (no empresa) toward totals', async () => {
      const coachee = {
        id: 'c1',
        empresaId: null,
        tarifaPropia: 40000,
        empresa: null,
      };
      coacheesRepo.find.mockResolvedValue([coachee]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
      ]);

      const resumen = await service.calcularResumenCobros();

      expect(resumen.ingresoDelPeriodoTotal).toBe(40000);
      expect(resumen.horasRealizadasTotal).toBe(1);
      expect(resumen.porEmpresa).toHaveLength(0);
    });

    it('counts consumed hours but zero income for an unpaid empresa', async () => {
      const coachee = {
        id: 'c1',
        empresaId: 'e1',
        tarifaPropia: null,
        empresa: {
          id: 'e1',
          nombre: 'Empresa B',
          tarifaHora: 30000,
          pagada: false,
        },
      };
      coacheesRepo.find.mockResolvedValue([coachee]);
      empresasRepo.find.mockResolvedValue([coachee.empresa]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
      ]);

      const resumen = await service.calcularResumenCobros();

      expect(resumen.porEmpresa[0].horasConsumidas).toBe(1);
      expect(resumen.porEmpresa[0].ingresoDelPeriodo).toBe(0);
      expect(resumen.ingresoDelPeriodoTotal).toBe(0);
    });

    it('splits realized vs. future sessions into período vs. proyectado', async () => {
      const coachee = {
        id: 'c1',
        empresaId: 'e1',
        tarifaPropia: null,
        empresa: {
          id: 'e1',
          nombre: 'Empresa C',
          tarifaHora: 20000,
          pagada: true,
        },
      };
      coacheesRepo.find.mockResolvedValue([coachee]);
      empresasRepo.find.mockResolvedValue([coachee.empresa]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
        { coacheeId: 'c1', fechaHora: en1h },
      ]);

      const resumen = await service.calcularResumenCobros();

      expect(resumen.ingresoDelPeriodoTotal).toBe(20000);
      expect(resumen.ingresoProyectadoTotal).toBe(20000);
      expect(resumen.horasRealizadasTotal).toBe(1);
    });

    it('breaks down porCoachee for both an empresa-linked and an independent coachee', async () => {
      const coacheeEmpresa = {
        id: 'c1',
        nombre: 'Ana',
        empresaId: 'e1',
        tarifaPropia: null,
        empresa: {
          id: 'e1',
          nombre: 'Empresa A',
          tarifaHora: 30000,
          pagada: true,
        },
      };
      const coacheeIndependiente = {
        id: 'c2',
        nombre: 'Beto',
        empresaId: null,
        tarifaPropia: 40000,
        empresa: null,
      };
      coacheesRepo.find.mockResolvedValue([
        coacheeEmpresa,
        coacheeIndependiente,
      ]);
      empresasRepo.find.mockResolvedValue([coacheeEmpresa.empresa]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
        { coacheeId: 'c2', fechaHora: hace1h },
        { coacheeId: 'c2', fechaHora: en1h },
      ]);

      const resumen = await service.calcularResumenCobros();

      expect(resumen.porCoachee).toEqual([
        {
          coacheeId: 'c2',
          nombre: 'Beto',
          empresaNombre: null,
          horasRealizadas: 1,
          ingresoDelPeriodo: 40000,
          ingresoProyectado: 40000,
        },
        {
          coacheeId: 'c1',
          nombre: 'Ana',
          empresaNombre: 'Empresa A',
          horasRealizadas: 1,
          ingresoDelPeriodo: 30000,
          ingresoProyectado: 0,
        },
      ]);
    });

    it('excludes coachees with no sessions in the period from porCoachee', async () => {
      const activo = {
        id: 'c1',
        nombre: 'Ana',
        empresaId: null,
        tarifaPropia: 40000,
        empresa: null,
      };
      const inactivo = {
        id: 'c2',
        nombre: 'Beto',
        empresaId: null,
        tarifaPropia: 40000,
        empresa: null,
      };
      coacheesRepo.find.mockResolvedValue([activo, inactivo]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
      ]);

      const resumen = await service.calcularResumenCobros();

      expect(resumen.porCoachee.map((c) => c.coacheeId)).toEqual(['c1']);
    });
  });

  describe('rangoDePeriodo', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns the current calendar month for "mes"', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 2, 15));

      const { inicio, fin } = service.rangoDePeriodo('mes');

      expect(inicio).toEqual(new Date(2026, 2, 1));
      expect(fin).toEqual(new Date(2026, 3, 1));
    });

    it('returns Jan-Jun for "semestre" in the first half of the year', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 2, 15));

      const { inicio, fin } = service.rangoDePeriodo('semestre');

      expect(inicio).toEqual(new Date(2026, 0, 1));
      expect(fin).toEqual(new Date(2026, 6, 1));
    });

    it('returns Jul-Dec for "semestre" in the second half of the year', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 8, 15));

      const { inicio, fin } = service.rangoDePeriodo('semestre');

      expect(inicio).toEqual(new Date(2026, 6, 1));
      expect(fin).toEqual(new Date(2027, 0, 1));
    });

    it('returns Jan-Dec for "anio"', () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 8, 15));

      const { inicio, fin } = service.rangoDePeriodo('anio');

      expect(inicio).toEqual(new Date(2026, 0, 1));
      expect(fin).toEqual(new Date(2027, 0, 1));
    });
  });

  describe('resumenComercial', () => {
    it('combines cobros, solicitudes, procesos iniciados/cerrados and reagendamientos for the period', async () => {
      solicitudesProcesoRepo.find.mockResolvedValue([
        { id: 's1', estado: EstadoSolicitudProceso.ATENDIDA },
        { id: 's2', estado: EstadoSolicitudProceso.PENDIENTE },
        { id: 's3', estado: EstadoSolicitudProceso.PENDIENTE },
      ]);
      ciclosCoachingRepo.count.mockResolvedValue(4);
      ciclosCoachingRepo.find.mockResolvedValue([
        { resultado: ResultadoCiclo.LOGRADO },
        { resultado: ResultadoCiclo.LOGRADO },
        { resultado: ResultadoCiclo.NO_LOGRADO },
        { resultado: null },
      ]);
      solicitudesReagendamientoRepo.count.mockResolvedValue(5);

      const resumen = await service.resumenComercial('mes');

      expect(resumen.periodo).toBe('mes');
      expect(resumen.solicitudesNuevas).toBe(3);
      expect(resumen.solicitudesAtendidas).toBe(1);
      expect(resumen.solicitudesPendientes).toBe(2);
      expect(resumen.procesosIniciados).toBe(4);
      expect(resumen.procesosCerrados).toBe(4);
      expect(resumen.procesosCerradosPorResultado).toEqual({
        logrado: 2,
        medianamente_logrado: 0,
        no_logrado: 1,
      });
      expect(resumen.reagendamientosSolicitados).toBe(5);
    });

    it('reuses calcularResumenCobros for ingreso/horas/porCoachee, scoped to the selected period', async () => {
      const coachee = {
        id: 'c1',
        nombre: 'Ana',
        empresaId: null,
        tarifaPropia: 40000,
        empresa: null,
      };
      coacheesRepo.find.mockResolvedValue([coachee]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
        { coacheeId: 'c1', fechaHora: en1h },
      ]);

      const resumen = await service.resumenComercial('anio');

      expect(resumen.ingresoDelPeriodo).toBe(40000);
      expect(resumen.ingresoProyectado).toBe(40000);
      expect(resumen.horasRealizadas).toBe(1);
      expect(resumen.porCoachee).toEqual([
        {
          coacheeId: 'c1',
          nombre: 'Ana',
          empresaNombre: null,
          horasRealizadas: 1,
          ingresoDelPeriodo: 40000,
          ingresoProyectado: 40000,
        },
      ]);
    });
  });

  describe('proyeccionMensual', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns 12 months from the current one, each with its own combined confirmado+proyectado total', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 15)); // 15 ago 2026

      const coachee = {
        id: 'c1',
        nombre: 'Ana',
        empresaId: null,
        tarifaPropia: 40000,
        empresa: null,
      };
      coacheesRepo.find.mockResolvedValue([coachee]);

      let mesLlamado = -1;
      sesionesRepo.find.mockImplementation(() => {
        mesLlamado += 1;
        if (mesLlamado === 0) {
          // Mes actual (ago 2026): sesión ya realizada -> ingreso confirmado.
          return Promise.resolve([
            { coacheeId: 'c1', fechaHora: new Date(2026, 7, 10) },
          ]);
        }
        if (mesLlamado === 1) {
          // Mes siguiente (sep 2026): sesión agendada a futuro -> ingreso proyectado.
          return Promise.resolve([
            { coacheeId: 'c1', fechaHora: new Date(2026, 8, 5) },
          ]);
        }
        return Promise.resolve([]);
      });

      const proyeccion = await service.proyeccionMensual();

      expect(proyeccion).toHaveLength(12);
      expect(proyeccion[0]).toMatchObject({
        mes: '2026-08',
        etiqueta: "Ago '26",
        total: 40000,
        porCoachee: [{ nombre: 'Ana', monto: 40000 }],
      });
      expect(proyeccion[1]).toMatchObject({ mes: '2026-09', total: 40000 });
      expect(proyeccion[2]).toMatchObject({
        mes: '2026-10',
        total: 0,
        porCoachee: [],
      });
    });

    it('excludes empresas with no activity that month from porEmpresa', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 15));

      const coachee = {
        id: 'c1',
        nombre: 'Ana',
        empresaId: 'e1',
        tarifaPropia: null,
        empresa: {
          id: 'e1',
          nombre: 'Empresa A',
          tarifaHora: 30000,
          pagada: true,
        },
      };
      coacheesRepo.find.mockResolvedValue([coachee]);
      empresasRepo.find.mockResolvedValue([coachee.empresa]);

      let mesLlamado = -1;
      sesionesRepo.find.mockImplementation(() => {
        mesLlamado += 1;
        if (mesLlamado === 0) {
          return Promise.resolve([
            { coacheeId: 'c1', fechaHora: new Date(2026, 7, 10) },
          ]);
        }
        return Promise.resolve([]);
      });

      const proyeccion = await service.proyeccionMensual();

      expect(proyeccion[0].porEmpresa).toEqual([
        { nombre: 'Empresa A', monto: 30000 },
      ]);
      expect(proyeccion[1].porEmpresa).toEqual([]);
    });
  });

  describe('resumenNegocio', () => {
    it('combines cobros, coacheesActivos and satisfaccionPromedio', async () => {
      ciclosService.findAllAbiertosConEstado.mockResolvedValue([{}, {}]);
      postSesionesRepo.createQueryBuilder.mockReturnValue(
        makeAvgQueryBuilder('4.333'),
      );

      const resumen = await service.resumenNegocio();

      expect(resumen.coacheesActivos).toBe(2);
      expect(resumen.satisfaccionPromedio).toBe(4.3);
    });

    it('returns null satisfaccionPromedio when there is no data', async () => {
      const resumen = await service.resumenNegocio();

      expect(resumen.satisfaccionPromedio).toBeNull();
    });
  });

  describe('alertasSeguimiento', () => {
    it('flags cycles about to expire, coachees without recent logros, and without an upcoming session', async () => {
      ciclosService.findAllAbiertosConEstado.mockResolvedValue([
        {
          coacheeId: 'c1',
          coachee: { nombre: 'Coachee Uno' },
          alertaPorVencer: true,
          sesionesRestantes: 1,
        },
      ]);
      logrosRepo.exists.mockResolvedValue(false);
      sesionesRepo.exists.mockResolvedValue(false);

      const alertas = await service.alertasSeguimiento();

      expect(alertas.ciclosPorVencer).toEqual([
        { coacheeId: 'c1', nombre: 'Coachee Uno', sesionesRestantes: 1 },
      ]);
      expect(alertas.coacheesSinLogros).toEqual([
        { coacheeId: 'c1', nombre: 'Coachee Uno' },
      ]);
      expect(alertas.coacheesSinProximaSesion).toEqual([
        { coacheeId: 'c1', nombre: 'Coachee Uno' },
      ]);
    });

    it('does not flag a coachee with a recent logro and an upcoming session', async () => {
      ciclosService.findAllAbiertosConEstado.mockResolvedValue([
        {
          coacheeId: 'c1',
          coachee: { nombre: 'Coachee Uno' },
          alertaPorVencer: false,
          sesionesRestantes: 8,
        },
      ]);
      logrosRepo.exists.mockResolvedValue(true);
      sesionesRepo.exists.mockResolvedValue(true);

      const alertas = await service.alertasSeguimiento();

      expect(alertas.ciclosPorVencer).toHaveLength(0);
      expect(alertas.coacheesSinLogros).toHaveLength(0);
      expect(alertas.coacheesSinProximaSesion).toHaveLength(0);
    });
  });

  describe('avancePorArea', () => {
    it('groups by areaGerencia, defaulting to "Sin área asignada", and excludes coachees without avance', async () => {
      coacheesRepo.find.mockResolvedValue([
        { id: 'c1', areaGerencia: 'Comercial' },
        { id: 'c2', areaGerencia: 'Comercial' },
        { id: 'c3', areaGerencia: null },
        { id: 'c4', areaGerencia: 'Operaciones' },
      ]);
      seguimiento.avanceGeneralForCoachee.mockImplementation((id: string) => {
        const map: Record<string, number | null> = {
          c1: 80,
          c2: 60,
          c3: 50,
          c4: null,
        };
        return Promise.resolve(map[id]);
      });

      const resultado = await service.avancePorArea();

      expect(resultado).toEqual([
        { area: 'Comercial', avancePromedio: 70, coacheesCount: 2 },
        { area: 'Sin área asignada', avancePromedio: 50, coacheesCount: 1 },
      ]);
    });
  });
});
