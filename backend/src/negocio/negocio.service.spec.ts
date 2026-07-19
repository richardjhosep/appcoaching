import { Repository } from 'typeorm';
import { NegocioService } from './negocio.service';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { PostSesion } from '../sesiones/entities/post-sesion.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { Logro } from '../seguimiento/entities/logro.entity';
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
