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
import { OrigenAsignacion } from './enums/origen-asignacion.enum';
import { CoacheesService } from '../coachees/coachees.service';

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
    service = new RecursosService(
      recursosRepo as unknown as Repository<Recurso>,
      asignacionesRepo as unknown as Repository<AsignacionRecurso>,
      coachees as unknown as CoacheesService,
    );
  });

  describe('create', () => {
    it('rejects a link resource without url', async () => {
      await expect(
        service.create({ titulo: 'x', tipo: TipoRecurso.LINK }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an archivo resource without a file', async () => {
      await expect(
        service.create({ titulo: 'x', tipo: TipoRecurso.ARCHIVO }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a link resource, parsing comma-separated etiquetas', async () => {
      const recurso = await service.create({
        titulo: 'Artículo',
        tipo: TipoRecurso.LINK,
        url: 'https://example.com',
        etiquetas: 'liderazgo, comunicación',
      });

      expect(recurso.url).toBe('https://example.com');
      expect(recurso.etiquetas).toEqual(['liderazgo', 'comunicación']);
    });

    it('creates an archivo resource from the uploaded file', async () => {
      const recurso = await service.create(
        { titulo: 'PDF', tipo: TipoRecurso.ARCHIVO },
        { originalname: 'manual.pdf', filename: 'uuid-generado.pdf' },
      );

      expect(recurso.archivoNombre).toBe('manual.pdf');
      expect(recurso.archivoPath).toBe('uuid-generado.pdf');
    });
  });

  describe('assignForCoachee', () => {
    it('rejects when the coachee does not exist', async () => {
      recursosRepo.findOne.mockResolvedValue({ id: 'r1' });
      coachees.exists.mockResolvedValue(false);

      await expect(
        service.assignForCoachee('r1', 'missing', true),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a new coach assignment when none exists', async () => {
      recursosRepo.findOne.mockResolvedValue({ id: 'r1' });
      coachees.exists.mockResolvedValue(true);
      asignacionesRepo.findOne.mockResolvedValue(null);

      const asignacion = await service.assignForCoachee('r1', 'c1', true);

      expect(asignacion.origen).toBe(OrigenAsignacion.COACH);
      expect(asignacion.activa).toBe(true);
    });

    it('toggles an existing assignment', async () => {
      recursosRepo.findOne.mockResolvedValue({ id: 'r1' });
      coachees.exists.mockResolvedValue(true);
      asignacionesRepo.findOne.mockResolvedValue({
        id: 'a1',
        recursoId: 'r1',
        coacheeId: 'c1',
        activa: true,
        origen: OrigenAsignacion.COACH,
      });

      const asignacion = await service.assignForCoachee('r1', 'c1', false);

      expect(asignacion.activa).toBe(false);
    });
  });

  describe('autoasignar / quitarAutoasignacion', () => {
    it('creates a self-assignment', async () => {
      recursosRepo.findOne.mockResolvedValue({ id: 'r1' });
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      asignacionesRepo.findOne.mockResolvedValue(null);

      const asignacion = await service.autoasignar('user-1', 'r1');

      expect(asignacion.origen).toBe(OrigenAsignacion.AUTOASIGNADO);
      expect(asignacion.activa).toBe(true);
    });

    it('rejects removing a coach-assigned resource from the coachee side', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      asignacionesRepo.findOne.mockResolvedValue({
        id: 'a1',
        activa: true,
        origen: OrigenAsignacion.COACH,
      });

      await expect(
        service.quitarAutoasignacion('user-1', 'r1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deactivates a self-assignment', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      const asignacion = {
        id: 'a1',
        activa: true,
        origen: OrigenAsignacion.AUTOASIGNADO,
      };
      asignacionesRepo.findOne.mockResolvedValue(asignacion);

      await service.quitarAutoasignacion('user-1', 'r1');

      expect(asignacion.activa).toBe(false);
    });
  });

  describe('misRecursos', () => {
    it('returns an empty list when there are no active assignments', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      asignacionesRepo.find.mockResolvedValue([]);

      const result = await service.misRecursos('user-1');

      expect(result).toEqual([]);
      expect(recursosRepo.find).not.toHaveBeenCalled();
    });

    it('returns the resources for the active assignments', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      asignacionesRepo.find.mockResolvedValue([
        { recursoId: 'r1' },
        { recursoId: 'r2' },
      ]);
      recursosRepo.find.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);

      const result = await service.misRecursos('user-1');

      expect(result).toHaveLength(2);
    });
  });

  describe('assertEnBibliotecaDeCoachee', () => {
    it('rejects when the resource is not in the biblioteca', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      asignacionesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assertEnBibliotecaDeCoachee('user-1', 'r1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('resolves the coacheeId when the resource is in the biblioteca', async () => {
      coachees.findByUserId.mockResolvedValue({ id: 'c1' });
      asignacionesRepo.findOne.mockResolvedValue({ activa: true });

      await expect(
        service.assertEnBibliotecaDeCoachee('user-1', 'r1'),
      ).resolves.toBe('c1');
    });
  });

  describe('findAll', () => {
    it('applies both search and etiqueta filters', async () => {
      const qb = makeQueryBuilder([{ id: 'r1' }]);
      recursosRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('manual', 'liderazgo');

      expect(qb.andWhere).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ id: 'r1' }]);
    });
  });
});
