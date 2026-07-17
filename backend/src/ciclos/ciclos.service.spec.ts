import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CiclosService } from './ciclos.service';
import { CicloCoaching } from './entities/ciclo-coaching.entity';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { ResultadoCiclo } from './enums/resultado-ciclo.enum';
import { Role } from '../auth/enums/role.enum';
import { CoacheesService } from '../coachees/coachees.service';
import { PlanesDesarrolloService } from '../planes-desarrollo/planes-desarrollo.service';
import { SeguimientoService } from '../seguimiento/seguimiento.service';

type PartialCiclo = Partial<CicloCoaching>;

describe('CiclosService', () => {
  let service: CiclosService;
  let ciclosRepo: {
    findOne: jest.Mock<Promise<PartialCiclo | null>, unknown[]>;
    find: jest.Mock<Promise<PartialCiclo[]>, unknown[]>;
    create: jest.Mock<PartialCiclo, [PartialCiclo]>;
    save: jest.Mock<Promise<PartialCiclo>, [PartialCiclo]>;
  };
  let sesionesRepo: { count: jest.Mock<Promise<number>, unknown[]> };
  let coachees: {
    exists: jest.Mock;
    findByUserId: jest.Mock;
    findOneForActor: jest.Mock;
  };
  let planesDesarrollo: { getByCoacheeId: jest.Mock };
  let seguimiento: { avanceGeneralForCoachee: jest.Mock };

  beforeEach(() => {
    ciclosRepo = {
      findOne: jest.fn<Promise<PartialCiclo | null>, unknown[]>(),
      find: jest.fn<Promise<PartialCiclo[]>, unknown[]>(),
      create: jest.fn((data: PartialCiclo) => data),
      save: jest.fn((data: PartialCiclo) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
    };
    sesionesRepo = {
      count: jest.fn<Promise<number>, unknown[]>().mockResolvedValue(0),
    };
    coachees = {
      exists: jest.fn(),
      findByUserId: jest.fn(),
      findOneForActor: jest.fn(),
    };
    planesDesarrollo = { getByCoacheeId: jest.fn() };
    seguimiento = {
      avanceGeneralForCoachee: jest.fn().mockResolvedValue(null),
    };
    service = new CiclosService(
      ciclosRepo as unknown as Repository<CicloCoaching>,
      sesionesRepo as unknown as Repository<Sesion>,
      coachees as unknown as CoacheesService,
      planesDesarrollo as unknown as PlanesDesarrolloService,
      seguimiento as unknown as SeguimientoService,
    );
  });

  describe('abrir', () => {
    it('rejects when the coachee does not exist', async () => {
      coachees.exists.mockResolvedValue(false);

      await expect(
        service.abrir({ coacheeId: 'missing', totalSesiones: 10 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects when the coachee already has an open cycle', async () => {
      coachees.exists.mockResolvedValue(true);
      ciclosRepo.findOne.mockResolvedValue({ id: 'ciclo-1' });

      await expect(
        service.abrir({ coacheeId: 'coachee-1', totalSesiones: 10 }),
      ).rejects.toThrow(ConflictException);
    });

    it('opens a new cycle when none is open', async () => {
      coachees.exists.mockResolvedValue(true);
      ciclosRepo.findOne.mockResolvedValue(null);

      const ciclo = await service.abrir({
        coacheeId: 'coachee-1',
        totalSesiones: 10,
      });

      expect(ciclo.coacheeId).toBe('coachee-1');
      expect(ciclo.totalSesiones).toBe(10);
      expect(ciclo.sesionesRestantes).toBe(10);
      expect(ciclo.alertaPorVencer).toBe(false);
    });
  });

  describe('cerrar', () => {
    it('rejects closing an already-closed cycle', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        fechaCierre: new Date('2026-01-01'),
        totalSesiones: 10,
      });

      await expect(
        service.cerrar('ciclo-1', ResultadoCiclo.LOGRADO),
      ).rejects.toThrow(ConflictException);
    });

    it('sets fechaCierre and resultado', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        fechaCierre: null,
        totalSesiones: 10,
      });

      const ciclo = await service.cerrar('ciclo-1', ResultadoCiclo.LOGRADO);

      expect(ciclo.resultado).toBe(ResultadoCiclo.LOGRADO);
      expect(ciclo.fechaCierre).toBeInstanceOf(Date);
      expect(ciclo.alertaPorVencer).toBe(false);
    });
  });

  describe('attachEstado (via findOneWithEstado)', () => {
    it('flags alertaPorVencer when 2 or fewer sessions remain and the cycle is open', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        totalSesiones: 10,
        fechaCierre: null,
      });
      sesionesRepo.count.mockResolvedValue(8);

      const ciclo = await service.findOneWithEstado('ciclo-1');

      expect(ciclo.sesionesRealizadas).toBe(8);
      expect(ciclo.sesionesRestantes).toBe(2);
      expect(ciclo.alertaPorVencer).toBe(true);
    });

    it('does not flag alertaPorVencer for a closed cycle even with 0 remaining', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        totalSesiones: 10,
        fechaCierre: new Date('2026-01-01'),
      });
      sesionesRepo.count.mockResolvedValue(10);

      const ciclo = await service.findOneWithEstado('ciclo-1');

      expect(ciclo.sesionesRestantes).toBe(0);
      expect(ciclo.alertaPorVencer).toBe(false);
    });
  });

  describe('generarBorradorInforme', () => {
    it('builds a draft from the plan, session count and avance even without a plan', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        coacheeId: 'coachee-1',
        totalSesiones: 10,
        fechaApertura: new Date('2026-01-01'),
        fechaCierre: null,
      });
      sesionesRepo.count.mockResolvedValue(3);
      planesDesarrollo.getByCoacheeId.mockRejectedValue(
        new NotFoundException(),
      );
      seguimiento.avanceGeneralForCoachee.mockResolvedValue(70);

      const ciclo = await service.generarBorradorInforme('ciclo-1');

      expect(ciclo.informeFinal).toContain('Sesiones realizadas: 3 de 10');
      expect(ciclo.informeFinal).toContain('70%');
      expect(ciclo.informeFinal).toContain('Sin plan de desarrollo');
    });

    it('includes objetivos and objetivoGeneral when a plan exists', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        coacheeId: 'coachee-1',
        totalSesiones: 10,
        fechaApertura: new Date('2026-01-01'),
        fechaCierre: null,
      });
      sesionesRepo.count.mockResolvedValue(3);
      planesDesarrollo.getByCoacheeId.mockResolvedValue({
        objetivoGeneral: 'Mejorar liderazgo',
        objetivos: [{ descripcion: 'Delegar más' }],
      });
      seguimiento.avanceGeneralForCoachee.mockResolvedValue(null);

      const ciclo = await service.generarBorradorInforme('ciclo-1');

      expect(ciclo.informeFinal).toContain('Mejorar liderazgo');
      expect(ciclo.informeFinal).toContain('Delegar más');
      expect(ciclo.informeFinal).toContain('sin autoevaluación registrada');
    });
  });

  describe('assertPuedeDescargarPdf', () => {
    const ciclo = { id: 'ciclo-1', coacheeId: 'coachee-1', totalSesiones: 10 };

    it('allows the coach unconditionally', async () => {
      ciclosRepo.findOne.mockResolvedValue(ciclo);

      await expect(
        service.assertPuedeDescargarPdf('ciclo-1', {
          id: 'user-coach',
          role: Role.COACH,
        } as never),
      ).resolves.toBe(ciclo);
    });

    it('rejects a coachee who does not own the cycle', async () => {
      ciclosRepo.findOne.mockResolvedValue(ciclo);
      coachees.findByUserId.mockResolvedValue({ id: 'other-coachee' });

      await expect(
        service.assertPuedeDescargarPdf('ciclo-1', {
          id: 'user-coachee',
          role: Role.COACHEE,
        } as never),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows the coachee who owns the cycle', async () => {
      ciclosRepo.findOne.mockResolvedValue(ciclo);
      coachees.findByUserId.mockResolvedValue({ id: 'coachee-1' });

      await expect(
        service.assertPuedeDescargarPdf('ciclo-1', {
          id: 'user-coachee',
          role: Role.COACHEE,
        } as never),
      ).resolves.toBe(ciclo);
    });

    it('delegates empresa scoping to CoacheesService.findOneForActor', async () => {
      ciclosRepo.findOne.mockResolvedValue(ciclo);
      coachees.findOneForActor.mockRejectedValue(new ForbiddenException());

      await expect(
        service.assertPuedeDescargarPdf('ciclo-1', {
          id: 'user-empresa',
          role: Role.EMPRESA,
        } as never),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
