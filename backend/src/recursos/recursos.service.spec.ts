import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { RecursosService } from './recursos.service';
import { Recurso } from './entities/recurso.entity';
import { AsignacionRecurso } from './entities/asignacion-recurso.entity';
import { TipoRecurso } from './enums/tipo-recurso.enum';
import { CoacheesService } from '../coachees/coachees.service';
import { CarpetasService } from './carpetas.service';
import { CompetenciasService } from '../competencias/competencias.service';
import { finDelDiaChileAUtc } from '../common/chile-time.util';

type PartialRecurso = Partial<Recurso>;
type PartialAsignacion = Partial<AsignacionRecurso>;

function makeQueryBuilder(result: unknown) {
  const qb: Record<string, jest.Mock> = {};
  qb.andWhere = jest.fn(() => qb);
  qb.orderBy = jest.fn(() => qb);
  qb.getMany = jest.fn(() => Promise.resolve(result));
  return qb;
}

describe('RecursosService', () => {
  let service: RecursosService;
  let recursosRepo: {
    findOne: jest.Mock<Promise<PartialRecurso | null>, unknown[]>;
    find: jest.Mock<Promise<PartialRecurso[]>, unknown[]>;
    create: jest.Mock<PartialRecurso, [PartialRecurso]>;
    save: jest.Mock<Promise<PartialRecurso>, [PartialRecurso]>;
    delete: jest.Mock<Promise<{ affected: number }>, unknown[]>;
    createQueryBuilder: jest.Mock;
  };
  let asignacionesRepo: {
    findOne: jest.Mock<Promise<PartialAsignacion | null>, unknown[]>;
    find: jest.Mock<Promise<PartialAsignacion[]>, unknown[]>;
    create: jest.Mock<PartialAsignacion, [PartialAsignacion]>;
    save: jest.Mock<Promise<PartialAsignacion>, [PartialAsignacion]>;
  };
  let coachees: { exists: jest.Mock; findByUserId: jest.Mock };
  let carpetas: {
    findOne: jest.Mock;
    carpetasVisiblesIds: jest.Mock;
    carpetaVisible: jest.Mock;
  };
  let competencias: { exists: jest.Mock };

  beforeEach(() => {
    recursosRepo = {
      findOne: jest.fn<Promise<PartialRecurso | null>, unknown[]>(),
      find: jest.fn<Promise<PartialRecurso[]>, unknown[]>(),
      create: jest.fn((data: PartialRecurso) => data),
      save: jest.fn((data: PartialRecurso) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
      delete: jest.fn<Promise<{ affected: number }>, unknown[]>(),
      createQueryBuilder: jest.fn(),
    };
    asignacionesRepo = {
      findOne: jest.fn<Promise<PartialAsignacion | null>, unknown[]>(),
      find: jest.fn<Promise<PartialAsignacion[]>, unknown[]>(),
      create: jest.fn((data: PartialAsignacion) => data),
      save: jest.fn((data: PartialAsignacion) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
    };
    coachees = { exists: jest.fn(), findByUserId: jest.fn() };
    carpetas = {
      findOne: jest.fn().mockResolvedValue({ id: 'carpeta-1' }),
      carpetasVisiblesIds: jest.fn(),
      carpetaVisible: jest.fn(),
    };
    competencias = { exists: jest.fn().mockResolvedValue(true) };
    service = new RecursosService(
      recursosRepo as unknown as Repository<Recurso>,
      asignacionesRepo as unknown as Repository<AsignacionRecurso>,
      coachees as unknown as CoacheesService,
      carpetas as unknown as CarpetasService,
      competencias as unknown as CompetenciasService,
    );
  });

  describe('create', () => {
    it('rejects a link resource without url', async () => {
      await expect(
        service.create({
          titulo: 'x',
          tipo: TipoRecurso.LINK,
          carpetaId: 'carpeta-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an archivo resource without a file', async () => {
      await expect(
        service.create({
          titulo: 'x',
          tipo: TipoRecurso.ARCHIVO,
          carpetaId: 'carpeta-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a link resource in the given carpeta', async () => {
      const recurso = await service.create({
        titulo: 'Artículo',
        tipo: TipoRecurso.LINK,
        url: 'https://example.com',
        carpetaId: 'carpeta-1',
      });

      expect(recurso.url).toBe('https://example.com');
      expect(recurso.carpetaId).toBe('carpeta-1');
    });

    it('creates an archivo resource from the uploaded file', async () => {
      const recurso = await service.create(
        { titulo: 'PDF', tipo: TipoRecurso.ARCHIVO, carpetaId: 'carpeta-1' },
        { originalname: 'manual.pdf', filename: 'uuid-generado.pdf' },
      );

      expect(recurso.archivoNombre).toBe('manual.pdf');
      expect(recurso.archivoPath).toBe('uuid-generado.pdf');
    });

    it('rejects a competenciaId that does not exist', async () => {
      competencias.exists.mockResolvedValue(false);

      await expect(
        service.create({
          titulo: 'Artículo',
          tipo: TipoRecurso.LINK,
          url: 'https://example.com',
          carpetaId: 'carpeta-1',
          competenciaId: 'comp-inexistente',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('accepts a valid competenciaId', async () => {
      const recurso = await service.create({
        titulo: 'Artículo',
        tipo: TipoRecurso.LINK,
        url: 'https://example.com',
        carpetaId: 'carpeta-1',
        competenciaId: 'comp-1',
      });

      expect(recurso.competenciaId).toBe('comp-1');
    });

    it('converts fechaLimite to the end of that day in Chile time', async () => {
      const recurso = await service.create({
        titulo: 'Artículo',
        tipo: TipoRecurso.LINK,
        url: 'https://example.com',
        carpetaId: 'carpeta-1',
        fechaLimite: '2026-10-15',
      });

      expect(recurso.fechaLimite).toEqual(finDelDiaChileAUtc('2026-10-15'));
    });
  });

  describe('update', () => {
    it('sets and clears fechaLimite', async () => {
      recursosRepo.findOne.mockResolvedValue({ id: 'r1' });

      const conFecha = await service.update('r1', {
        fechaLimite: '2026-10-15',
      });
      expect(conFecha.fechaLimite).toEqual(finDelDiaChileAUtc('2026-10-15'));

      recursosRepo.findOne.mockResolvedValue({
        id: 'r1',
        fechaLimite: finDelDiaChileAUtc('2026-10-15'),
      });
      const sinFecha = await service.update('r1', { fechaLimite: null });
      expect(sinFecha.fechaLimite).toBeNull();
    });
  });

  describe('assignForCoachee', () => {
    it('rejects when the coachee does not exist', async () => {
      recursosRepo.findOne.mockResolvedValue({ id: 'r1' });
      coachees.exists.mockResolvedValue(false);

      await expect(
        service.assignForCoachee('r1', 'missing', true, undefined),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a new coach assignment when none exists', async () => {
      recursosRepo.findOne.mockResolvedValue({ id: 'r1' });
      coachees.exists.mockResolvedValue(true);
      asignacionesRepo.findOne.mockResolvedValue(null);

      const asignacion = await service.assignForCoachee(
        'r1',
        'c1',
        true,
        undefined,
      );

      expect(asignacion.activa).toBe(true);
      expect(asignacion.expiraEn).toBeNull();
    });

    it('sets an expiration date when provided', async () => {
      recursosRepo.findOne.mockResolvedValue({ id: 'r1' });
      coachees.exists.mockResolvedValue(true);
      asignacionesRepo.findOne.mockResolvedValue(null);

      const asignacion = await service.assignForCoachee(
        'r1',
        'c1',
        true,
        '2026-12-31T00:00:00.000Z',
      );

      expect(asignacion.expiraEn).toEqual(new Date('2026-12-31T00:00:00.000Z'));
    });

    it('toggles an existing assignment', async () => {
      recursosRepo.findOne.mockResolvedValue({ id: 'r1' });
      coachees.exists.mockResolvedValue(true);
      asignacionesRepo.findOne.mockResolvedValue({
        id: 'a1',
        recursoId: 'r1',
        coacheeId: 'c1',
        activa: true,
      });

      const asignacion = await service.assignForCoachee(
        'r1',
        'c1',
        false,
        undefined,
      );

      expect(asignacion.activa).toBe(false);
    });
  });

  describe('misRecursos', () => {
    it('returns an empty list when nothing is visible', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      carpetas.carpetasVisiblesIds.mockResolvedValue(new Set());
      asignacionesRepo.find.mockResolvedValue([]);

      const result = await service.misRecursos('user-1');

      expect(result).toEqual([]);
      expect(recursosRepo.find).not.toHaveBeenCalled();
    });

    it('returns resources whose carpeta is visible', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      carpetas.carpetasVisiblesIds.mockResolvedValue(new Set(['carpeta-1']));
      asignacionesRepo.find.mockResolvedValue([]);
      recursosRepo.find.mockResolvedValue([
        { id: 'r1', carpetaId: 'carpeta-1' },
        { id: 'r2', carpetaId: 'carpeta-otra' },
      ]);

      const result = await service.misRecursos('user-1');

      expect(result).toEqual([{ id: 'r1', carpetaId: 'carpeta-1' }]);
    });

    it('also returns resources shared directly, regardless of their carpeta', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      carpetas.carpetasVisiblesIds.mockResolvedValue(new Set());
      asignacionesRepo.find.mockResolvedValue([{ recursoId: 'r2' }]);
      recursosRepo.find.mockResolvedValue([
        { id: 'r1', carpetaId: 'carpeta-privada' },
        { id: 'r2', carpetaId: 'carpeta-privada' },
      ]);

      const result = await service.misRecursos('user-1');

      expect(result).toEqual([{ id: 'r2', carpetaId: 'carpeta-privada' }]);
    });

    it('excludes a resource whose fechaLimite already passed, even if its carpeta is visible', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      carpetas.carpetasVisiblesIds.mockResolvedValue(new Set(['carpeta-1']));
      asignacionesRepo.find.mockResolvedValue([]);
      recursosRepo.find.mockResolvedValue([
        {
          id: 'vencido',
          carpetaId: 'carpeta-1',
          fechaLimite: new Date('2020-01-01T00:00:00.000Z'),
        },
        { id: 'vigente', carpetaId: 'carpeta-1', fechaLimite: null },
      ]);

      const result = await service.misRecursos('user-1');

      expect(result.map((r) => r.id)).toEqual(['vigente']);
    });
  });

  describe('assertEnBibliotecaDeCoachee', () => {
    it('rejects when neither the carpeta nor the recurso are shared', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      recursosRepo.findOne.mockResolvedValue({
        id: 'r1',
        carpetaId: 'carpeta-1',
      });
      carpetas.carpetaVisible.mockResolvedValue(false);
      asignacionesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assertEnBibliotecaDeCoachee('user-1', 'r1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('resolves the coacheeId when the carpeta is visible', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      recursosRepo.findOne.mockResolvedValue({
        id: 'r1',
        carpetaId: 'carpeta-1',
      });
      carpetas.carpetaVisible.mockResolvedValue(true);
      asignacionesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assertEnBibliotecaDeCoachee('user-1', 'r1'),
      ).resolves.toBe('c1');
    });
  });

  describe('findAll', () => {
    it('applies both carpetaId and search filters', async () => {
      const qb = makeQueryBuilder([{ id: 'r1' }]);
      recursosRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('carpeta-1', 'manual');

      expect(qb.andWhere).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ id: 'r1' }]);
    });
  });
});
