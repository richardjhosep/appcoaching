import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SatisfaccionService } from './satisfaccion.service';
import { EncuestaSatisfaccion } from './entities/encuesta-satisfaccion.entity';
import { SolicitudProceso } from './entities/solicitud-proceso.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { EstadoSolicitudProceso } from './enums/estado-solicitud-proceso.enum';

function makeAvgQueryBuilder(avg: string | null) {
  const qb: Record<string, jest.Mock> = {};
  qb.select = jest.fn(() => qb);
  qb.where = jest.fn(() => qb);
  qb.getRawOne = jest.fn(() => Promise.resolve({ avg }));
  return qb;
}

describe('SatisfaccionService', () => {
  let service: SatisfaccionService;
  let encuestasRepo: {
    find: jest.Mock;
    exists: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let solicitudesRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let coacheesRepo: { find: jest.Mock };
  let ciclosRepo: { count: jest.Mock; findOne: jest.Mock; find: jest.Mock };
  let sesionesRepo: { count: jest.Mock; find: jest.Mock };

  beforeEach(() => {
    encuestasRepo = {
      find: jest.fn().mockResolvedValue([]),
      exists: jest.fn().mockResolvedValue(false),
      create: jest.fn((data: Partial<EncuestaSatisfaccion>) => data),
      save: jest.fn((data: Partial<EncuestaSatisfaccion>) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      createQueryBuilder: jest.fn(() => makeAvgQueryBuilder(null)),
    };
    solicitudesRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((data: Partial<SolicitudProceso>) => data),
      save: jest.fn((data: Partial<SolicitudProceso>) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
    };
    coacheesRepo = { find: jest.fn().mockResolvedValue([]) };
    ciclosRepo = {
      count: jest.fn().mockResolvedValue(0),
      findOne: jest.fn().mockResolvedValue({
        id: 'ciclo-1',
        coachee: { id: 'c1', empresaId: 'e1' },
      }),
      find: jest.fn().mockResolvedValue([]),
    };
    sesionesRepo = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
    };

    service = new SatisfaccionService(
      encuestasRepo as unknown as Repository<EncuestaSatisfaccion>,
      solicitudesRepo as unknown as Repository<SolicitudProceso>,
      coacheesRepo as unknown as Repository<Coachee>,
      ciclosRepo as unknown as Repository<CicloCoaching>,
      sesionesRepo as unknown as Repository<Sesion>,
    );
  });

  describe('crearEncuesta / listarEncuestas', () => {
    it('creates a survey scoped to the empresa and ciclo, with calificacion averaged from respuestas', async () => {
      const encuesta = await service.crearEncuesta('e1', {
        cicloId: 'ciclo-1',
        respuestas: [
          { categoria: 'Comunicación', valor: 5 },
          { categoria: 'Cumplimiento', valor: 4 },
        ],
        comentario: 'Excelente proceso',
      });

      expect(encuesta.empresaId).toBe('e1');
      expect(encuesta.cicloId).toBe('ciclo-1');
      expect(encuesta.calificacion).toBe(5); // round(4.5) === 5 (banker's off, JS rounds half up)
    });

    it('throws NotFoundException when the ciclo does not exist', async () => {
      ciclosRepo.findOne.mockResolvedValue(null);

      await expect(
        service.crearEncuesta('e1', {
          cicloId: 'missing',
          respuestas: [{ categoria: 'Comunicación', valor: 5 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the ciclo belongs to a different empresa', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        coachee: { id: 'c1', empresaId: 'otra-empresa' },
      });

      await expect(
        service.crearEncuesta('e1', {
          cicloId: 'ciclo-1',
          respuestas: [{ categoria: 'Comunicación', valor: 5 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the ciclo already has an encuesta', async () => {
      encuestasRepo.exists.mockResolvedValue(true);

      await expect(
        service.crearEncuesta('e1', {
          cicloId: 'ciclo-1',
          respuestas: [{ categoria: 'Comunicación', valor: 5 }],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('marcarAtendida', () => {
    it('throws NotFoundException when the solicitud does not exist', async () => {
      solicitudesRepo.findOne.mockResolvedValue(null);

      await expect(service.marcarAtendida('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('marks the solicitud as atendida', async () => {
      solicitudesRepo.findOne.mockResolvedValue({
        id: 's1',
        estado: EstadoSolicitudProceso.PENDIENTE,
      });

      const solicitud = await service.marcarAtendida('s1');

      expect(solicitud.estado).toBe(EstadoSolicitudProceso.ATENDIDA);
    });
  });

  describe('kpis', () => {
    it('returns zeroed KPIs with null tasaAsistencia when the empresa has no coachees', async () => {
      coacheesRepo.find.mockResolvedValue([]);

      const kpis = await service.kpis('e1');

      expect(kpis).toEqual({
        procesosTerminados: 0,
        procesosEnCurso: 0,
        tasaAsistencia: null,
        satisfaccionPromedio: null,
      });
    });

    it('computes tasaAsistencia as a percentage of sessions with recorded attendance', async () => {
      coacheesRepo.find.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
      ciclosRepo.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
      sesionesRepo.count.mockResolvedValueOnce(4).mockResolvedValueOnce(3);
      encuestasRepo.createQueryBuilder.mockReturnValue(
        makeAvgQueryBuilder('4.5'),
      );

      const kpis = await service.kpis('e1');

      expect(kpis.procesosTerminados).toBe(2);
      expect(kpis.procesosEnCurso).toBe(1);
      expect(kpis.tasaAsistencia).toBe(75);
      expect(kpis.satisfaccionPromedio).toBe(4.5);
    });

    it('returns null tasaAsistencia when no session has attendance recorded yet', async () => {
      coacheesRepo.find.mockResolvedValue([{ id: 'c1' }]);
      sesionesRepo.count.mockResolvedValue(0);

      const kpis = await service.kpis('e1');

      expect(kpis.tasaAsistencia).toBeNull();
    });
  });

  describe('tendenciaParaEmpresa', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns 6 months, all-null, when the empresa has no coachees', async () => {
      coacheesRepo.find.mockResolvedValue([]);

      const tendencia = await service.tendenciaParaEmpresa('e1');

      expect(tendencia).toHaveLength(6);
      expect(tendencia[5]).toEqual(
        expect.objectContaining({
          satisfaccionPromedio: null,
          pctLogrado: null,
          tasaAsistencia: null,
        }),
      );
    });

    it('returns all-null for a month with no encuestas, cierres, or sesiones con asistencia', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 15));
      coacheesRepo.find.mockResolvedValue([{ id: 'c1' }]);

      const tendencia = await service.tendenciaParaEmpresa('e1', 1);

      expect(tendencia).toEqual([
        {
          mes: '2026-08',
          etiqueta: "Ago '26",
          satisfaccionPromedio: null,
          pctLogrado: null,
          tasaAsistencia: null,
        },
      ]);
    });

    it('aggregates satisfacción, % logrado and tasa de asistencia within the month', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 7, 15));
      coacheesRepo.find.mockResolvedValue([{ id: 'c1' }]);
      encuestasRepo.find.mockResolvedValue([
        { calificacion: 5 },
        { calificacion: 3 },
      ]);
      ciclosRepo.find.mockResolvedValue([
        { resultado: 'logrado' },
        { resultado: 'logrado' },
        { resultado: 'no_logrado' },
      ]);
      sesionesRepo.count.mockResolvedValueOnce(4).mockResolvedValueOnce(3);

      const tendencia = await service.tendenciaParaEmpresa('e1', 1);

      expect(tendencia[0].satisfaccionPromedio).toBe(4); // (5+3)/2
      expect(tendencia[0].pctLogrado).toBe(67); // round(2/3 * 100)
      expect(tendencia[0].tasaAsistencia).toBe(75); // round(3/4 * 100)
    });
  });
});
