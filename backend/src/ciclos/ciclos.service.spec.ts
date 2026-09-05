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
import { RetroalimentacionService } from '../retroalimentacion/retroalimentacion.service';
import { validarPdfSubido } from '../common/file-type-filter.util';

jest.mock('../common/file-type-filter.util', () => ({
  validarPdfSubido: jest.fn(),
}));

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
  let seguimiento: {
    avanceGeneralForCoachee: jest.Mock;
    listLogrosForCoachee: jest.Mock;
  };
  let retroalimentacion: { listForCoachee: jest.Mock };

  beforeEach(() => {
    jest.mocked(validarPdfSubido).mockResolvedValue(undefined);
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
      listLogrosForCoachee: jest.fn().mockResolvedValue([]),
    };
    retroalimentacion = { listForCoachee: jest.fn().mockResolvedValue([]) };
    service = new CiclosService(
      ciclosRepo as unknown as Repository<CicloCoaching>,
      sesionesRepo as unknown as Repository<Sesion>,
      coachees as unknown as CoacheesService,
      planesDesarrollo as unknown as PlanesDesarrolloService,
      seguimiento as unknown as SeguimientoService,
      retroalimentacion as unknown as RetroalimentacionService,
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

    it('rejects closing when the coachee has no plan at all', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        coacheeId: 'coachee-1',
        fechaCierre: null,
        totalSesiones: 10,
      });
      planesDesarrollo.getByCoacheeId.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        service.cerrar('ciclo-1', ResultadoCiclo.LOGRADO),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects closing when the plan exists but is not aprobado', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        coacheeId: 'coachee-1',
        fechaCierre: null,
        totalSesiones: 10,
      });
      planesDesarrollo.getByCoacheeId.mockResolvedValue({
        estado: 'pendiente_aprobacion',
      });

      await expect(
        service.cerrar('ciclo-1', ResultadoCiclo.LOGRADO),
      ).rejects.toThrow(ConflictException);
    });

    it('sets fechaCierre and resultado once the plan is aprobado', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        coacheeId: 'coachee-1',
        fechaCierre: null,
        totalSesiones: 10,
      });
      planesDesarrollo.getByCoacheeId.mockResolvedValue({
        estado: 'aprobado',
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

  describe('updateImpactoNegocio', () => {
    it('sets the field, independent of informeFinal', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        totalSesiones: 10,
        fechaCierre: null,
        informeFinal: 'Informe ya escrito',
        impactoNegocio: null,
      });
      sesionesRepo.count.mockResolvedValue(0);

      const ciclo = await service.updateImpactoNegocio(
        'ciclo-1',
        'Redujo el tiempo de entrega en 20%.',
      );

      expect(ciclo.impactoNegocio).toBe('Redujo el tiempo de entrega en 20%.');
      expect(ciclo.informeFinal).toBe('Informe ya escrito');
    });

    it('rejects when the ciclo does not exist', async () => {
      ciclosRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateImpactoNegocio('missing', 'texto'),
      ).rejects.toThrow(NotFoundException);
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

    it('includes logros under "Avances Observados"', async () => {
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
      seguimiento.avanceGeneralForCoachee.mockResolvedValue(null);
      seguimiento.listLogrosForCoachee.mockResolvedValue([
        {
          fecha: '2026-07-10',
          descripcion: 'Lideró la reunión de equipo',
          createdAt: new Date('2026-07-10'),
        },
      ]);

      const ciclo = await service.generarBorradorInforme('ciclo-1');

      expect(ciclo.informeFinal).toContain('Avances Observados');
      expect(ciclo.informeFinal).toContain(
        '2026-07-10: Lideró la reunión de equipo',
      );
    });

    it("excludes logros created outside this ciclo's date window (from a previous ciclo)", async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-2',
        coacheeId: 'coachee-1',
        totalSesiones: 10,
        fechaApertura: new Date('2026-06-01'),
        fechaCierre: new Date('2026-08-01'),
      });
      sesionesRepo.count.mockResolvedValue(3);
      planesDesarrollo.getByCoacheeId.mockRejectedValue(
        new NotFoundException(),
      );
      seguimiento.avanceGeneralForCoachee.mockResolvedValue(null);
      seguimiento.listLogrosForCoachee.mockResolvedValue([
        {
          fecha: '2026-01-15',
          descripcion: 'Logro del ciclo anterior',
          createdAt: new Date('2026-01-15'), // antes de fechaApertura de ciclo-2
        },
        {
          fecha: '2026-07-01',
          descripcion: 'Logro de este ciclo',
          createdAt: new Date('2026-07-01'), // dentro de la ventana
        },
      ]);

      const ciclo = await service.generarBorradorInforme('ciclo-2');

      expect(ciclo.informeFinal).toContain('Logro de este ciclo');
      expect(ciclo.informeFinal).not.toContain('Logro del ciclo anterior');
    });

    it('includes the retroalimentación del coachee for this ciclo when it exists', async () => {
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
      seguimiento.avanceGeneralForCoachee.mockResolvedValue(null);
      retroalimentacion.listForCoachee.mockResolvedValue([
        {
          cicloId: 'ciclo-1',
          loQueMasGusto: 'La cercanía del coach',
          mayoresAprendizajes: null,
          sugerencias: null,
          otrosComentarios: null,
        },
        { cicloId: 'ciclo-otro', loQueMasGusto: 'no debería aparecer' },
      ]);

      const ciclo = await service.generarBorradorInforme('ciclo-1');

      expect(ciclo.informeFinal).toContain(
        'Retroalimentación del Coachee al Cierre',
      );
      expect(ciclo.informeFinal).toContain('La cercanía del coach');
      expect(ciclo.informeFinal).not.toContain('no debería aparecer');
    });
  });

  describe('uploadInformePdf', () => {
    it('validates the file is really a PDF before storing it', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        coacheeId: 'coachee-1',
        totalSesiones: 10,
        fechaApertura: new Date('2026-01-01'),
        fechaCierre: null,
      });

      const ciclo = await service.uploadInformePdf('ciclo-1', {
        originalname: 'informe.pdf',
        filename: 'uuid-1.pdf',
      });

      expect(validarPdfSubido).toHaveBeenCalledWith(
        { originalname: 'informe.pdf', filename: 'uuid-1.pdf' },
        expect.any(String),
      );
      expect(ciclo.informePdfPath).toBe('uuid-1.pdf');
      expect(ciclo.informePdfNombre).toBe('informe.pdf');
    });

    it('rejects and never saves when the file is not really a PDF', async () => {
      ciclosRepo.findOne.mockResolvedValue({
        id: 'ciclo-1',
        coacheeId: 'coachee-1',
        totalSesiones: 10,
        fechaApertura: new Date('2026-01-01'),
        fechaCierre: null,
      });
      jest
        .mocked(validarPdfSubido)
        .mockRejectedValue(new Error('El archivo no es un PDF válido.'));

      await expect(
        service.uploadInformePdf('ciclo-1', {
          originalname: 'informe.pdf',
          filename: 'uuid-evil.pdf',
        }),
      ).rejects.toThrow('El archivo no es un PDF válido.');
      expect(ciclosRepo.save).not.toHaveBeenCalled();
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

  describe('findAllCerradosConEstado', () => {
    it('returns every closed cycle across the platform with its estado attached', async () => {
      ciclosRepo.find.mockResolvedValue([
        {
          id: 'ciclo-1',
          totalSesiones: 5,
          fechaCierre: new Date('2026-01-01'),
          coachee: { nombre: 'Coachee Uno' } as CicloCoaching['coachee'],
        },
      ]);

      const cerrados = await service.findAllCerradosConEstado();

      expect(cerrados).toHaveLength(1);
      expect(cerrados[0].alertaPorVencer).toBe(false);
      expect(ciclosRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { fechaCierre: 'DESC' } }),
      );
    });
  });
});
