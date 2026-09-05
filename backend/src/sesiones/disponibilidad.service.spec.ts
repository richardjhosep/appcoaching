import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DisponibilidadService } from './disponibilidad.service';
import { DisponibilidadCoach } from './entities/disponibilidad-coach.entity';
import { SolicitudSesion } from './entities/solicitud-sesion.entity';
import { EstadoSolicitudSesion } from './enums/estado-solicitud-sesion.enum';
import { SesionesService } from './sesiones.service';
import { localChileAUtc } from '../common/chile-time.util';

type PartialBloque = Partial<DisponibilidadCoach>;
type PartialSolicitud = Partial<SolicitudSesion>;

describe('DisponibilidadService', () => {
  let service: DisponibilidadService;
  let bloquesRepo: {
    find: jest.Mock<Promise<PartialBloque[]>, unknown[]>;
    create: jest.Mock<PartialBloque, [PartialBloque]>;
    save: jest.Mock<Promise<PartialBloque>, [PartialBloque]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
  };
  let solicitudesRepo: {
    find: jest.Mock<Promise<PartialSolicitud[]>, unknown[]>;
  };
  let sesionesService: {
    findEnRango: jest.Mock<Promise<{ fechaHora: Date }[]>, unknown[]>;
  };

  beforeEach(() => {
    bloquesRepo = {
      find: jest
        .fn<Promise<PartialBloque[]>, unknown[]>()
        .mockResolvedValue([]),
      create: jest.fn((data: PartialBloque) => data),
      save: jest.fn((data: PartialBloque) =>
        Promise.resolve({ id: 'bloque-1', ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
    };
    solicitudesRepo = {
      find: jest
        .fn<Promise<PartialSolicitud[]>, unknown[]>()
        .mockResolvedValue([]),
    };
    sesionesService = {
      findEnRango: jest
        .fn<Promise<{ fechaHora: Date }[]>, unknown[]>()
        .mockResolvedValue([]),
    };
    service = new DisponibilidadService(
      bloquesRepo as unknown as Repository<DisponibilidadCoach>,
      solicitudesRepo as unknown as Repository<SolicitudSesion>,
      sesionesService as unknown as SesionesService,
    );
  });

  describe('crearBloque', () => {
    it('rejects when horaInicio no es antes que horaFin', async () => {
      await expect(
        service.crearBloque({
          diaSemana: 1,
          horaInicio: '18:00',
          horaFin: '09:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('crea el bloque cuando el rango es válido', async () => {
      const bloque = await service.crearBloque({
        diaSemana: 1,
        horaInicio: '09:00',
        horaFin: '18:00',
      });

      expect(bloque.diaSemana).toBe(1);
    });
  });

  describe('eliminarBloque', () => {
    it('throws NotFoundException when nothing was deleted', async () => {
      bloquesRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.eliminarBloque('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('resolves when the block was deleted', async () => {
      bloquesRepo.delete.mockResolvedValue({ affected: 1 });

      await expect(service.eliminarBloque('b1')).resolves.toBeUndefined();
    });
  });

  describe('calcularSlotsLibres', () => {
    // 2027-03-08 es lunes — lejos en el futuro para no chocar con el filtro de "ya pasó".
    const lunes = new Date(Date.UTC(2027, 2, 8));
    const domingoSiguiente = new Date(Date.UTC(2027, 2, 14));

    it('returns nothing when the coach has no availability blocks configured', async () => {
      const slots = await service.calcularSlotsLibres(lunes, domingoSiguiente);
      expect(slots).toEqual([]);
    });

    it('generates one slot per hour inside the block, converted correctly from Chile local time', async () => {
      bloquesRepo.find.mockResolvedValue([
        { diaSemana: 1, horaInicio: '09:00', horaFin: '11:00' },
      ]);

      const slots = await service.calcularSlotsLibres(lunes, domingoSiguiente);

      expect(slots).toEqual([
        localChileAUtc(2027, 3, 8, '09:00'),
        localChileAUtc(2027, 3, 8, '10:00'),
      ]);
    });

    it('excludes a slot already taken by an existing session (any coachee)', async () => {
      bloquesRepo.find.mockResolvedValue([
        { diaSemana: 1, horaInicio: '09:00', horaFin: '11:00' },
      ]);
      sesionesService.findEnRango.mockResolvedValue([
        { fechaHora: localChileAUtc(2027, 3, 8, '09:00') },
      ]);

      const slots = await service.calcularSlotsLibres(lunes, domingoSiguiente);

      expect(slots).toEqual([localChileAUtc(2027, 3, 8, '10:00')]);
    });

    it('excludes a slot with a pending solicitud de sesión', async () => {
      bloquesRepo.find.mockResolvedValue([
        { diaSemana: 1, horaInicio: '09:00', horaFin: '11:00' },
      ]);
      solicitudesRepo.find.mockResolvedValue([
        {
          fechaHoraPropuesta: localChileAUtc(2027, 3, 8, '10:00'),
          estado: EstadoSolicitudSesion.PENDIENTE,
        },
      ]);

      const slots = await service.calcularSlotsLibres(lunes, domingoSiguiente);

      expect(slots).toEqual([localChileAUtc(2027, 3, 8, '09:00')]);
    });

    it('excludes slots already in the past', async () => {
      // 2020-01-06 es lunes, muy en el pasado — sin depender de la hora exacta en que
      // corre el test (a diferencia de usar "hoy").
      bloquesRepo.find.mockResolvedValue([
        { diaSemana: 1, horaInicio: '09:00', horaFin: '11:00' },
      ]);
      const lunesPasado = new Date(Date.UTC(2020, 0, 6));

      const slots = await service.calcularSlotsLibres(lunesPasado, lunesPasado);

      expect(slots).toEqual([]);
    });
  });
});
