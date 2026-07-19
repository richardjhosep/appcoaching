import { NotFoundException } from '@nestjs/common';
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
  let ciclosRepo: { count: jest.Mock };
  let sesionesRepo: { count: jest.Mock };

  beforeEach(() => {
    encuestasRepo = {
      find: jest.fn().mockResolvedValue([]),
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
    ciclosRepo = { count: jest.fn().mockResolvedValue(0) };
    sesionesRepo = { count: jest.fn().mockResolvedValue(0) };

    service = new SatisfaccionService(
      encuestasRepo as unknown as Repository<EncuestaSatisfaccion>,
      solicitudesRepo as unknown as Repository<SolicitudProceso>,
      coacheesRepo as unknown as Repository<Coachee>,
      ciclosRepo as unknown as Repository<CicloCoaching>,
      sesionesRepo as unknown as Repository<Sesion>,
    );
  });

  describe('crearEncuesta / listarEncuestas', () => {
    it('creates a survey scoped to the empresa', async () => {
      const encuesta = await service.crearEncuesta('e1', {
        calificacion: 5,
        comentario: 'Excelente proceso',
      });

      expect(encuesta.empresaId).toBe('e1');
      expect(encuesta.calificacion).toBe(5);
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
});
