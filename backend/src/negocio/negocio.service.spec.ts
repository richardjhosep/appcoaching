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
import { DisponibilidadCoach } from '../sesiones/entities/disponibilidad-coach.entity';
import { CiclosService } from '../ciclos/ciclos.service';
import { SeguimientoService } from '../seguimiento/seguimiento.service';
import { EmailService } from '../email/email.service';
import { EmpresasService } from '../empresas/empresas.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

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
    count: jest.Mock;
  };
  let postSesionesRepo: { createQueryBuilder: jest.Mock };
  let empresasRepo: { find: jest.Mock };
  let coacheesRepo: { find: jest.Mock; findOne: jest.Mock; count: jest.Mock };
  let logrosRepo: { exists: jest.Mock };
  let solicitudesProcesoRepo: { find: jest.Mock };
  let solicitudesReagendamientoRepo: { count: jest.Mock };
  let ciclosCoachingRepo: { count: jest.Mock; find: jest.Mock };
  let disponibilidadRepo: { find: jest.Mock };
  let ciclosService: { findAllAbiertosConEstado: jest.Mock };
  let seguimiento: { avanceGeneralForCoachee: jest.Mock };
  let email: {
    sendRecordatorioSesion: jest.Mock;
    sendRecordatorioLogro: jest.Mock;
  };
  let config: { get: jest.Mock };
  let empresasService: { ultimaGestionPorEmpresa: jest.Mock };

  const hace1h = new Date(Date.now() - 60 * 60 * 1000);
  const en1h = new Date(Date.now() + 60 * 60 * 1000);

  beforeEach(() => {
    sesionesRepo = {
      find: jest.fn().mockResolvedValue([]),
      exists: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    };
    postSesionesRepo = {
      createQueryBuilder: jest.fn(() => makeAvgQueryBuilder(null)),
    };
    empresasRepo = { find: jest.fn().mockResolvedValue([]) };
    coacheesRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    };
    logrosRepo = { exists: jest.fn() };
    solicitudesProcesoRepo = { find: jest.fn().mockResolvedValue([]) };
    solicitudesReagendamientoRepo = { count: jest.fn().mockResolvedValue(0) };
    ciclosCoachingRepo = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
    };
    disponibilidadRepo = { find: jest.fn().mockResolvedValue([]) };
    ciclosService = {
      findAllAbiertosConEstado: jest.fn().mockResolvedValue([]),
    };
    seguimiento = { avanceGeneralForCoachee: jest.fn() };
    email = {
      sendRecordatorioSesion: jest.fn().mockResolvedValue(undefined),
      sendRecordatorioLogro: jest.fn().mockResolvedValue(undefined),
    };
    config = { get: jest.fn().mockReturnValue('http://localhost:5183') };
    empresasService = {
      ultimaGestionPorEmpresa: jest.fn().mockResolvedValue(new Map()),
    };

    service = new NegocioService(
      sesionesRepo as unknown as Repository<Sesion>,
      postSesionesRepo as unknown as Repository<PostSesion>,
      empresasRepo as unknown as Repository<Empresa>,
      coacheesRepo as unknown as Repository<Coachee>,
      logrosRepo as unknown as Repository<Logro>,
      solicitudesProcesoRepo as unknown as Repository<SolicitudProceso>,
      solicitudesReagendamientoRepo as unknown as Repository<SolicitudReagendamiento>,
      ciclosCoachingRepo as unknown as Repository<CicloCoaching>,
      disponibilidadRepo as unknown as Repository<DisponibilidadCoach>,
      ciclosService as unknown as CiclosService,
      seguimiento as unknown as SeguimientoService,
      email as unknown as EmailService,
      config as unknown as ConfigService,
      empresasService as unknown as EmpresasService,
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

    it('gastoBruto* is never gated by pagada — porCoacheeGastoBruto includes a coachee excluded from porCoachee', async () => {
      const coachee = {
        id: 'c1',
        nombre: 'Ana',
        empresaId: 'e1',
        tarifaPropia: null,
        empresa: {
          id: 'e1',
          nombre: 'Empresa sin pagar',
          tarifaHora: 30000,
          pagada: false,
        },
      };
      coacheesRepo.find.mockResolvedValue([coachee]);
      empresasRepo.find.mockResolvedValue([coachee.empresa]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
        { coacheeId: 'c1', fechaHora: en1h },
      ]);

      const resumen = await service.calcularResumenCobros();

      // porCoachee (gated) sigue vacío, como siempre — no se toca su comportamiento.
      expect(resumen.porCoachee).toEqual([]);
      // porEmpresa sigue con ingreso $0 (gated) pero ahora también trae el gasto real.
      expect(resumen.porEmpresa[0]).toMatchObject({
        ingresoDelPeriodo: 0,
        ingresoProyectado: 0,
        gastoBrutoDelPeriodo: 30000,
        gastoBrutoProyectado: 30000,
      });
      // porCoacheeGastoBruto (nuevo, sin gate) sí incluye a Ana.
      expect(resumen.porCoacheeGastoBruto).toEqual([
        {
          coacheeId: 'c1',
          nombre: 'Ana',
          empresaNombre: 'Empresa sin pagar',
          horasRealizadas: 1,
          gastoBrutoDelPeriodo: 30000,
          gastoBrutoProyectado: 30000,
        },
      ]);
    });
  });

  describe('miInversion', () => {
    it('returns null when the coachee belongs to an empresa', async () => {
      coacheesRepo.findOne.mockResolvedValue({ id: 'c1', empresaId: 'e1' });

      const resultado = await service.miInversion('user-1', 'mes');

      expect(resultado).toBeNull();
    });

    it('returns null when the actor has no coachee profile', async () => {
      coacheesRepo.findOne.mockResolvedValue(null);

      const resultado = await service.miInversion('user-x', 'mes');

      expect(resultado).toBeNull();
    });

    it('returns the honest período figures for an independent coachee with activity', async () => {
      const coachee = {
        id: 'c1',
        nombre: 'Beto',
        userId: 'user-1',
        empresaId: null,
        tarifaPropia: 40000,
        empresa: null,
      };
      coacheesRepo.findOne.mockResolvedValue(coachee);
      coacheesRepo.find.mockResolvedValue([coachee]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
        { coacheeId: 'c1', fechaHora: en1h },
      ]);

      const resultado = await service.miInversion('user-1', 'mes');

      expect(resultado).toEqual({
        periodo: 'mes',
        horasRealizadas: 1,
        montoDelPeriodo: 40000,
        montoProyectado: 40000,
        tarifaPropia: 40000,
      });
    });

    it('returns zeros, not an error, when the independent coachee had no activity', async () => {
      const coachee = {
        id: 'c1',
        nombre: 'Beto',
        userId: 'user-1',
        empresaId: null,
        tarifaPropia: 40000,
        empresa: null,
      };
      coacheesRepo.findOne.mockResolvedValue(coachee);
      coacheesRepo.find.mockResolvedValue([coachee]);
      sesionesRepo.find.mockResolvedValue([]);

      const resultado = await service.miInversion('user-1', 'mes');

      expect(resultado).toEqual({
        periodo: 'mes',
        horasRealizadas: 0,
        montoDelPeriodo: 0,
        montoProyectado: 0,
        tarifaPropia: 40000,
      });
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

  describe('resumenParaEmpresa', () => {
    it('reports the honest gasto (unaffected by pagada) and gastoPendiente when unpaid', async () => {
      const coachee = {
        id: 'c1',
        nombre: 'Ana',
        empresaId: 'e1',
        tarifaPropia: null,
        empresa: {
          id: 'e1',
          nombre: 'Empresa sin pagar',
          tarifaHora: 30000,
          horasContratadas: 40,
          pagada: false,
        },
      };
      coacheesRepo.find
        .mockResolvedValueOnce([coachee]) // calcularResumenCobros()
        .mockResolvedValueOnce([coachee]); // this.coachees.find({ where: { empresaId } })
      empresasRepo.find.mockResolvedValue([coachee.empresa]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
      ]);

      const resumen = await service.resumenParaEmpresa('e1');

      expect(resumen).toEqual({
        pagada: false,
        horasContratadas: 40,
        horasConsumidas: 1,
        gastoDelPeriodo: 30000,
        gastoProyectado: 0,
        gastoPendiente: 30000,
        porCoachee: [
          {
            coacheeId: 'c1',
            nombre: 'Ana',
            empresaNombre: 'Empresa sin pagar',
            horasRealizadas: 1,
            gastoBrutoDelPeriodo: 30000,
            gastoBrutoProyectado: 0,
          },
        ],
      });
    });

    it('gastoPendiente is 0 once the coach marks the empresa as pagada', async () => {
      const coachee = {
        id: 'c1',
        nombre: 'Ana',
        empresaId: 'e1',
        tarifaPropia: null,
        empresa: {
          id: 'e1',
          nombre: 'Empresa pagada',
          tarifaHora: 30000,
          horasContratadas: null,
          pagada: true,
        },
      };
      coacheesRepo.find
        .mockResolvedValueOnce([coachee])
        .mockResolvedValueOnce([coachee]);
      empresasRepo.find.mockResolvedValue([coachee.empresa]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
      ]);

      const resumen = await service.resumenParaEmpresa('e1');

      expect(resumen.gastoDelPeriodo).toBe(30000);
      expect(resumen.gastoPendiente).toBe(0);
    });

    it('never includes a coachee from a different empresa', async () => {
      const propio = {
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
      const ajeno = {
        id: 'c2',
        nombre: 'Beto',
        empresaId: 'e2',
        tarifaPropia: null,
        empresa: {
          id: 'e2',
          nombre: 'Empresa B',
          tarifaHora: 20000,
          pagada: true,
        },
      };
      coacheesRepo.find
        .mockResolvedValueOnce([propio, ajeno])
        .mockResolvedValueOnce([propio]); // solo los de e1
      empresasRepo.find.mockResolvedValue([propio.empresa, ajeno.empresa]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: hace1h },
        { coacheeId: 'c2', fechaHora: hace1h },
      ]);

      const resumen = await service.resumenParaEmpresa('e1');

      expect(resumen.porCoachee.map((c) => c.coacheeId)).toEqual(['c1']);
    });
  });

  describe('resumenAcumuladoParaEmpresa', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('splits a past session as ejecutado and a future one as agendado', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 15)); // 15-ago-2026 → 2do semestre

      const coachee = {
        id: 'c1',
        nombre: 'Ana',
        empresaId: 'e1',
        tarifaPropia: null,
        empresa: {
          id: 'e1',
          nombre: 'Empresa A',
          tarifaHora: 30000,
          horasContratadas: 40,
          pagada: true,
        },
      };
      coacheesRepo.find.mockResolvedValue([coachee]);
      empresasRepo.find.mockResolvedValue([coachee.empresa]);
      sesionesRepo.find.mockResolvedValue([
        { coacheeId: 'c1', fechaHora: new Date(2026, 7, 10) }, // pasada (antes del 15-ago)
        { coacheeId: 'c1', fechaHora: new Date(2026, 7, 20) }, // futura, mismo semestre/año
      ]);

      const resumen = await service.resumenAcumuladoParaEmpresa('e1');

      expect(resumen).toEqual({
        anio: 2026,
        semestre: 2,
        gastoEjecutadoSemestre: 30000,
        gastoAgendadoSemestre: 30000,
        gastoEjecutadoAnio: 30000,
        gastoAgendadoAnio: 30000,
      });
    });

    it('reports semestre 1 for a date in the first half of the year', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 2, 1)); // 1-mar-2026

      coacheesRepo.find.mockResolvedValue([]);
      empresasRepo.find.mockResolvedValue([]);
      sesionesRepo.find.mockResolvedValue([]);

      const resumen = await service.resumenAcumuladoParaEmpresa('e1');

      expect(resumen.semestre).toBe(1);
      expect(resumen.gastoEjecutadoSemestre).toBe(0);
    });
  });

  describe('retornoParaEmpresa', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns the empty shape when the empresa has no coachees', async () => {
      coacheesRepo.find.mockResolvedValue([]);

      const retorno = await service.retornoParaEmpresa('e1');

      expect(retorno).toEqual({
        costoTotalProcesosCerrados: 0,
        costoPromedioPorProceso: null,
        distribucionResultados: {
          logrado: 0,
          medianamente_logrado: 0,
          no_logrado: 0,
        },
        procesos: [],
      });
    });

    it('returns the empty shape when there are no ciclos cerrados yet', async () => {
      coacheesRepo.find.mockResolvedValue([
        {
          id: 'c1',
          nombre: 'Ana',
          empresaId: 'e1',
          tarifaPropia: null,
          empresa: { tarifaHora: 20000 },
        },
      ]);
      ciclosCoachingRepo.find.mockResolvedValue([]);

      const retorno = await service.retornoParaEmpresa('e1');

      expect(retorno.procesos).toEqual([]);
      expect(retorno.costoPromedioPorProceso).toBeNull();
    });

    it('costs each ciclo by its realized sessions only, and aggregates resultado + costo across procesos', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 15));

      coacheesRepo.find.mockResolvedValue([
        {
          id: 'c1',
          nombre: 'Ana',
          empresaId: 'e1',
          tarifaPropia: null,
          empresa: { tarifaHora: 20000 },
        },
      ]);
      ciclosCoachingRepo.find.mockResolvedValue([
        {
          id: 'ciclo-1',
          coacheeId: 'c1',
          fechaApertura: new Date(2026, 5, 1),
          fechaCierre: new Date(2026, 6, 1),
          resultado: 'logrado',
          impactoNegocio: 'Redujo el tiempo de respuesta en 20%.',
        },
        {
          id: 'ciclo-2',
          coacheeId: 'c1',
          fechaApertura: new Date(2026, 4, 1),
          fechaCierre: new Date(2026, 4, 20),
          resultado: 'no_logrado',
          impactoNegocio: null,
        },
      ]);
      sesionesRepo.find.mockResolvedValue([
        { cicloId: 'ciclo-1', fechaHora: new Date(2026, 5, 5) }, // realizada
        { cicloId: 'ciclo-1', fechaHora: new Date(2026, 5, 12) }, // realizada
        { cicloId: 'ciclo-1', fechaHora: new Date(2026, 8, 1) }, // futura — no cuenta
        { cicloId: 'ciclo-2', fechaHora: new Date(2026, 4, 3) }, // realizada, pero ciclo-2 no_logrado
      ]);

      const retorno = await service.retornoParaEmpresa('e1');

      expect(retorno.costoTotalProcesosCerrados).toBe(60000); // (2 + 1) sesiones realizadas × 20000
      expect(retorno.costoPromedioPorProceso).toBe(30000); // 60000 / 2 procesos
      expect(retorno.distribucionResultados).toEqual({
        logrado: 1,
        medianamente_logrado: 0,
        no_logrado: 1,
      });
      expect(retorno.procesos).toEqual([
        expect.objectContaining({
          cicloId: 'ciclo-1',
          coacheeNombre: 'Ana',
          costo: 40000,
          resultado: 'logrado',
          impactoNegocio: 'Redujo el tiempo de respuesta en 20%.',
        }),
        expect.objectContaining({
          cicloId: 'ciclo-2',
          costo: 20000,
          resultado: 'no_logrado',
          impactoNegocio: null,
        }),
      ]);
    });
  });

  describe('proyeccionParaEmpresa', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns 6 months, never includes porEmpresa, and scopes porCoachee to the empresa', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 15));

      const propio = {
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
      const ajeno = {
        id: 'c2',
        nombre: 'Beto',
        empresaId: 'e2',
        tarifaPropia: null,
        empresa: {
          id: 'e2',
          nombre: 'Empresa B',
          tarifaHora: 20000,
          pagada: false,
        },
      };
      coacheesRepo.find.mockImplementation(
        (opts?: { where?: { empresaId?: string } }) => {
          if (opts?.where?.empresaId) {
            return Promise.resolve(
              opts.where.empresaId === 'e1' ? [propio] : [ajeno],
            );
          }
          return Promise.resolve([propio, ajeno]);
        },
      );
      empresasRepo.find.mockResolvedValue([propio.empresa, ajeno.empresa]);

      let mesLlamado = -1;
      sesionesRepo.find.mockImplementation(() => {
        mesLlamado += 1;
        if (mesLlamado === 0) {
          return Promise.resolve([
            { coacheeId: 'c1', fechaHora: new Date(2026, 7, 10) },
            { coacheeId: 'c2', fechaHora: new Date(2026, 7, 10) },
          ]);
        }
        return Promise.resolve([]);
      });

      const proyeccion = await service.proyeccionParaEmpresa('e1');

      expect(proyeccion).toHaveLength(6);
      expect(proyeccion[0]).toEqual({
        mes: '2026-08',
        etiqueta: "Ago '26",
        total: 30000,
        porCoachee: [{ nombre: 'Ana', monto: 30000 }],
      });
      expect(proyeccion[0]).not.toHaveProperty('porEmpresa');
    });
  });

  describe('resumenNegocio', () => {
    it('combines cobros, coacheesActivos (cartera activa, no sólo con ciclo abierto) and satisfaccionPromedio', async () => {
      coacheesRepo.count.mockResolvedValue(3);
      postSesionesRepo.createQueryBuilder.mockReturnValue(
        makeAvgQueryBuilder('4.333'),
      );

      const resumen = await service.resumenNegocio();

      expect(coacheesRepo.count).toHaveBeenCalledWith({
        where: { activo: true },
      });
      expect(resumen.coacheesActivos).toBe(3);
      expect(resumen.satisfaccionPromedio).toBe(4.3);
    });

    it('returns null satisfaccionPromedio when there is no data', async () => {
      const resumen = await service.resumenNegocio();

      expect(resumen.satisfaccionPromedio).toBeNull();
    });
  });

  describe('carteraEmpresas', () => {
    function fechaEnDias(dias: number): string {
      const d = new Date();
      d.setDate(d.getDate() + dias);
      return d.toISOString().slice(0, 10);
    }

    it('classifies each empresa by how far its fechaFin is', async () => {
      empresasRepo.find.mockResolvedValue([
        {
          id: 'e-sin-fecha',
          nombre: 'Sin Fecha',
          fechaFin: null,
          pagada: true,
          horasContratadas: 10,
        },
        {
          id: 'e-vencida',
          nombre: 'Vencida',
          fechaFin: fechaEnDias(-5),
          pagada: true,
          horasContratadas: 10,
        },
        {
          id: 'e-este-mes',
          nombre: 'Este Mes',
          fechaFin: fechaEnDias(20),
          pagada: true,
          horasContratadas: 10,
        },
        {
          id: 'e-este-semestre',
          nombre: 'Este Semestre',
          fechaFin: fechaEnDias(90),
          pagada: true,
          horasContratadas: 10,
        },
        {
          id: 'e-vigente',
          nombre: 'Vigente',
          fechaFin: fechaEnDias(300),
          pagada: true,
          horasContratadas: 10,
        },
      ]);

      const cartera = await service.carteraEmpresas();

      const estadoPorNombre = Object.fromEntries(
        cartera.empresas.map((e) => [e.nombre, e.estado]),
      );
      expect(estadoPorNombre).toEqual({
        'Sin Fecha': 'sin_fecha',
        Vencida: 'vencido',
        'Este Mes': 'vence_este_mes',
        'Este Semestre': 'vence_este_semestre',
        Vigente: 'vigente',
      });
    });

    it('only flags independientes (coachees without empresa) whose ciclo is about to expire', async () => {
      ciclosService.findAllAbiertosConEstado.mockResolvedValue([
        {
          coacheeId: 'c-independiente',
          coachee: { nombre: 'Independiente Uno', empresaId: null },
          alertaPorVencer: true,
          sesionesRestantes: 1,
        },
        {
          coacheeId: 'c-de-empresa',
          coachee: { nombre: 'De Empresa', empresaId: 'e1' },
          alertaPorVencer: true,
          sesionesRestantes: 1,
        },
        {
          coacheeId: 'c-lejos',
          coachee: { nombre: 'Lejos de vencer', empresaId: null },
          alertaPorVencer: false,
          sesionesRestantes: 8,
        },
      ]);

      const cartera = await service.carteraEmpresas();

      expect(cartera.independientesPorVencer).toEqual([
        {
          coacheeId: 'c-independiente',
          nombre: 'Independiente Uno',
          sesionesRestantes: 1,
        },
      ]);
    });

    it('attaches the ultimaGestion of each empresa from EmpresasService', async () => {
      empresasRepo.find.mockResolvedValue([
        {
          id: 'e1',
          nombre: 'Con Gestión',
          fechaFin: null,
          pagada: true,
          horasContratadas: 10,
        },
        {
          id: 'e2',
          nombre: 'Sin Gestión',
          fechaFin: null,
          pagada: true,
          horasContratadas: 10,
        },
      ]);
      const fecha = new Date(2026, 7, 1);
      empresasService.ultimaGestionPorEmpresa.mockResolvedValue(
        new Map([
          [
            'e1',
            {
              nota: 'Llamada realizada',
              createdAt: fecha,
              proximoSeguimiento: '2026-09-01',
            },
          ],
        ]),
      );

      const cartera = await service.carteraEmpresas();

      const porNombre = Object.fromEntries(
        cartera.empresas.map((e) => [e.nombre, e.ultimaGestion]),
      );
      expect(porNombre['Con Gestión']).toEqual({
        nota: 'Llamada realizada',
        fecha,
        proximoSeguimiento: '2026-09-01',
      });
      expect(porNombre['Sin Gestión']).toBeNull();
    });
  });

  describe('atencionInmediata', () => {
    function fechaEnDias(dias: number): string {
      const d = new Date();
      d.setDate(d.getDate() + dias);
      return d.toISOString().slice(0, 10);
    }

    it('lists today/tomorrow unconfirmed sessions with the coachee relation loaded', async () => {
      sesionesRepo.find.mockImplementation(
        (opts?: { relations?: { coachee?: boolean } }) => {
          if (opts?.relations?.coachee) {
            return Promise.resolve([
              {
                id: 's1',
                coacheeId: 'c1',
                coachee: { nombre: 'Ana' },
                fechaHora: new Date(),
              },
            ]);
          }
          return Promise.resolve([]);
        },
      );

      const atencion = await service.atencionInmediata();

      expect(atencion.sesionesSinConfirmar).toEqual([
        {
          sesionId: 's1',
          coacheeId: 'c1',
          nombre: 'Ana',
          fechaHora: expect.any(Date) as Date,
        },
      ]);
    });

    it('flags a contrato as urgente when it expires soon and has no gestión at all', async () => {
      empresasRepo.find.mockResolvedValue([
        {
          id: 'e1',
          nombre: 'Empresa Urgente',
          fechaFin: fechaEnDias(10),
          pagada: false,
          horasContratadas: 10,
        },
      ]);

      const atencion = await service.atencionInmediata();

      expect(atencion.contratosUrgentes).toEqual([
        {
          empresaId: 'e1',
          nombre: 'Empresa Urgente',
          diasParaVencer: 10,
          ultimaGestion: null,
        },
      ]);
      expect(atencion.pagosPendientes).toEqual([
        { empresaId: 'e1', nombre: 'Empresa Urgente', gastoDelPeriodo: 0 },
      ]);
    });

    it('still flags a contrato as urgente when the last gestión proximoSeguimiento already passed', async () => {
      empresasRepo.find.mockResolvedValue([
        {
          id: 'e1',
          nombre: 'Empresa Urgente',
          fechaFin: fechaEnDias(10),
          pagada: true,
          horasContratadas: 10,
        },
      ]);
      empresasService.ultimaGestionPorEmpresa.mockResolvedValue(
        new Map([
          [
            'e1',
            {
              nota: 'Se contactó hace tiempo',
              createdAt: new Date(),
              proximoSeguimiento: fechaEnDias(-5),
            },
          ],
        ]),
      );

      const atencion = await service.atencionInmediata();

      expect(atencion.contratosUrgentes).toHaveLength(1);
    });

    it('excludes a contrato urgente when there is a gestión with a future proximoSeguimiento', async () => {
      empresasRepo.find.mockResolvedValue([
        {
          id: 'e1',
          nombre: 'Empresa Con Seguimiento',
          fechaFin: fechaEnDias(10),
          pagada: true,
          horasContratadas: 10,
        },
      ]);
      empresasService.ultimaGestionPorEmpresa.mockResolvedValue(
        new Map([
          [
            'e1',
            {
              nota: 'Llamada agendada',
              createdAt: new Date(),
              proximoSeguimiento: fechaEnDias(5),
            },
          ],
        ]),
      );

      const atencion = await service.atencionInmediata();

      expect(atencion.contratosUrgentes).toHaveLength(0);
    });

    it('does not flag a contrato that is not close to expiring', async () => {
      empresasRepo.find.mockResolvedValue([
        {
          id: 'e1',
          nombre: 'Empresa Tranquila',
          fechaFin: fechaEnDias(90),
          pagada: true,
          horasContratadas: 10,
        },
      ]);

      const atencion = await service.atencionInmediata();

      expect(atencion.contratosUrgentes).toHaveLength(0);
    });
  });

  describe('comparativoYCapacidad', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('combines ingreso mes actual/anterior, coachings iniciados, y horas comprometidas/disponibles', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 15)); // 15 ago 2026

      const coachee = {
        id: 'c1',
        nombre: 'Ana',
        empresaId: null,
        tarifaPropia: 40000,
        empresa: null,
      };
      coacheesRepo.find.mockResolvedValue([coachee]);

      sesionesRepo.find
        .mockResolvedValueOnce([
          { coacheeId: 'c1', fechaHora: new Date(2026, 7, 10) },
        ]) // mes actual
        .mockResolvedValueOnce([]); // mes anterior

      ciclosCoachingRepo.count
        .mockResolvedValueOnce(4) // mes actual
        .mockResolvedValueOnce(2); // mes anterior

      sesionesRepo.count.mockResolvedValue(3); // 3 sesiones esta semana
      disponibilidadRepo.find.mockResolvedValue([
        { horaInicio: '09:00', horaFin: '13:00' }, // 4h
        { horaInicio: '14:00', horaFin: '18:00' }, // 4h
      ]);

      const comparativo = await service.comparativoYCapacidad();

      expect(comparativo.ingresoMesActual).toBe(40000);
      expect(comparativo.ingresoMesAnterior).toBe(0);
      expect(comparativo.variacionIngresoPct).toBeNull();
      expect(comparativo.coachingsIniciadosMesActual).toBe(4);
      expect(comparativo.coachingsIniciadosMesAnterior).toBe(2);
      expect(comparativo.horasComprometidasSemana).toBe(3);
      expect(comparativo.horasDisponiblesSemana).toBe(8);
    });

    it('computes a positive variación when ingreso grew vs. the previous month', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 15));

      const coachee = {
        id: 'c1',
        nombre: 'Ana',
        empresaId: null,
        tarifaPropia: 10000,
        empresa: null,
      };
      coacheesRepo.find.mockResolvedValue([coachee]);

      sesionesRepo.find
        .mockResolvedValueOnce([
          { coacheeId: 'c1', fechaHora: new Date(2026, 7, 5) },
          { coacheeId: 'c1', fechaHora: new Date(2026, 7, 6) },
        ]) // mes actual: 20000
        .mockResolvedValueOnce([
          { coacheeId: 'c1', fechaHora: new Date(2026, 6, 5) },
        ]); // mes anterior: 10000

      const comparativo = await service.comparativoYCapacidad();

      expect(comparativo.ingresoMesActual).toBe(20000);
      expect(comparativo.ingresoMesAnterior).toBe(10000);
      expect(comparativo.variacionIngresoPct).toBe(100);
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

  describe('enviarRecordatorioSesion', () => {
    it('emails the coachee with a link to their sesiones view', async () => {
      coacheesRepo.findOne.mockResolvedValue({
        id: 'c1',
        nombre: 'Rodrigo Peña',
        user: { email: 'rodrigo@test.com' },
      });

      await service.enviarRecordatorioSesion('c1');

      expect(email.sendRecordatorioSesion).toHaveBeenCalledWith({
        to: 'rodrigo@test.com',
        nombreCoachee: 'Rodrigo Peña',
        verUrl: 'http://localhost:5183/coachee/sesiones',
      });
    });

    it('throws NotFoundException when the coachee has no linked email', async () => {
      coacheesRepo.findOne.mockResolvedValue({
        id: 'c1',
        nombre: 'Rodrigo Peña',
        user: undefined,
      });

      await expect(service.enviarRecordatorioSesion('c1')).rejects.toThrow(
        NotFoundException,
      );
      expect(email.sendRecordatorioSesion).not.toHaveBeenCalled();
    });
  });

  describe('enviarRecordatorioLogro', () => {
    it('emails the coachee with a link to their progreso view', async () => {
      coacheesRepo.findOne.mockResolvedValue({
        id: 'c1',
        nombre: 'Rodrigo Peña',
        user: { email: 'rodrigo@test.com' },
      });

      await service.enviarRecordatorioLogro('c1');

      expect(email.sendRecordatorioLogro).toHaveBeenCalledWith({
        to: 'rodrigo@test.com',
        nombreCoachee: 'Rodrigo Peña',
        verUrl: 'http://localhost:5183/coachee/progreso',
      });
    });

    it('throws NotFoundException when the coachee does not exist', async () => {
      coacheesRepo.findOne.mockResolvedValue(null);

      await expect(service.enviarRecordatorioLogro('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
