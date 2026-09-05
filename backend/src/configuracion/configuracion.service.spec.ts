import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { ConfiguracionService } from './configuracion.service';
import { ParametroConfiguracion } from './entities/parametro-configuracion.entity';
import { PARAMETROS_SEED } from './configuracion.seed-data';

type PartialParametro = Partial<ParametroConfiguracion>;

describe('ConfiguracionService', () => {
  let service: ConfiguracionService;
  let repo: {
    findOne: jest.Mock<Promise<PartialParametro | null>, unknown[]>;
    find: jest.Mock<Promise<PartialParametro[]>, unknown[]>;
    create: jest.Mock<PartialParametro, [PartialParametro]>;
    save: jest.Mock<Promise<PartialParametro>, [PartialParametro]>;
    remove: jest.Mock<Promise<PartialParametro>, [PartialParametro]>;
    createQueryBuilder: jest.Mock;
  };
  let insertBuilder: {
    insert: jest.Mock;
    into: jest.Mock;
    values: jest.Mock;
    orIgnore: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(() => {
    insertBuilder = {
      insert: jest.fn(),
      into: jest.fn(),
      values: jest.fn(),
      orIgnore: jest.fn(),
      execute: jest.fn(),
    };
    insertBuilder.insert.mockReturnValue(insertBuilder);
    insertBuilder.into.mockReturnValue(insertBuilder);
    insertBuilder.values.mockReturnValue(insertBuilder);
    insertBuilder.orIgnore.mockReturnValue(insertBuilder);
    insertBuilder.execute.mockResolvedValue({ identifiers: [] });

    repo = {
      findOne: jest.fn<Promise<PartialParametro | null>, unknown[]>(),
      find: jest.fn<Promise<PartialParametro[]>, unknown[]>(),
      create: jest.fn((data: PartialParametro) => data),
      save: jest.fn((data: PartialParametro) =>
        Promise.resolve({ id: 'generated-id', estado: true, ...data }),
      ),
      remove: jest.fn((data: PartialParametro) => Promise.resolve(data)),
      createQueryBuilder: jest.fn().mockReturnValue(insertBuilder),
    };
    service = new ConfiguracionService(
      repo as unknown as Repository<ParametroConfiguracion>,
    );
  });

  describe('onApplicationBootstrap', () => {
    it('inserts the seed catalog with orIgnore, never overwriting existing rows', async () => {
      await service.onApplicationBootstrap();

      expect(insertBuilder.values).toHaveBeenCalledWith(PARAMETROS_SEED);
      expect(insertBuilder.orIgnore).toHaveBeenCalled();
      expect(insertBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('listarPreguntasRetroalimentacion', () => {
    it('assembles {bloque, afirmacion} from the bloques index and each bloque group, active only', async () => {
      repo.find.mockImplementation(
        ({ where }: { where: { grupo: string } }) => {
          if (where.grupo === 'RETROALIMENTACION_BLOQUES') {
            return Promise.resolve([
              {
                grupo: 'RETROALIMENTACION_BLOQUES',
                clave: '1',
                valor: 'Bloque A',
              },
              {
                grupo: 'RETROALIMENTACION_BLOQUES',
                clave: '2',
                valor: 'Bloque B',
              },
            ]);
          }
          if (where.grupo === 'Bloque A') {
            return Promise.resolve([
              { grupo: 'Bloque A', clave: '1', valor: 'Pregunta A1' },
            ]);
          }
          if (where.grupo === 'Bloque B') {
            return Promise.resolve([
              { grupo: 'Bloque B', clave: '1', valor: 'Pregunta B1' },
            ]);
          }
          return Promise.resolve([]);
        },
      );

      const preguntas = await service.listarPreguntasRetroalimentacion();

      expect(preguntas).toEqual([
        { bloque: 'Bloque A', afirmacion: 'Pregunta A1' },
        { bloque: 'Bloque B', afirmacion: 'Pregunta B1' },
      ]);
    });

    it('excludes an inactive bloque or an inactive pregunta within an active bloque', async () => {
      repo.find.mockImplementation(
        ({ where }: { where: { grupo: string; estado: boolean } }) => {
          expect(where.estado).toBe(true);
          if (where.grupo === 'RETROALIMENTACION_BLOQUES') {
            return Promise.resolve([
              {
                grupo: 'RETROALIMENTACION_BLOQUES',
                clave: '1',
                valor: 'Bloque A',
              },
            ]);
          }
          return Promise.resolve([
            { grupo: 'Bloque A', clave: '1', valor: 'Pregunta activa' },
          ]);
        },
      );

      const preguntas = await service.listarPreguntasRetroalimentacion();

      expect(preguntas).toEqual([
        { bloque: 'Bloque A', afirmacion: 'Pregunta activa' },
      ]);
    });
  });

  describe('listarCategoriasSatisfaccion', () => {
    it('returns the active category names, in order, as a flat list', async () => {
      repo.find.mockResolvedValue([
        { grupo: 'SATISFACCION_CATEGORIAS', clave: '1', valor: 'Comunicación' },
        { grupo: 'SATISFACCION_CATEGORIAS', clave: '2', valor: 'Cumplimiento' },
      ]);

      const categorias = await service.listarCategoriasSatisfaccion();

      expect(categorias).toEqual(['Comunicación', 'Cumplimiento']);
    });
  });

  describe('crear', () => {
    it('creates a new parametro', async () => {
      const parametro = await service.crear({
        grupo: 'Bloque A',
        clave: '1',
        valor: 'Nueva pregunta',
      });

      expect(parametro).toEqual(
        expect.objectContaining({
          grupo: 'Bloque A',
          clave: '1',
          valor: 'Nueva pregunta',
        }),
      );
    });

    it('rejects a duplicate (grupo, clave)', async () => {
      repo.save.mockRejectedValue(
        new QueryFailedError('insert', [], new Error('duplicate key')),
      );

      await expect(
        service.crear({ grupo: 'Bloque A', clave: '1', valor: 'Dup' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('actualizar', () => {
    it('merges the given fields onto the existing parametro', async () => {
      repo.findOne.mockResolvedValue({
        id: 'p1',
        grupo: 'Bloque A',
        clave: '1',
        valor: 'Vieja',
        estado: true,
      });

      const actualizado = await service.actualizar('p1', {
        valor: 'Nueva',
        estado: false,
      });

      expect(actualizado.valor).toBe('Nueva');
      expect(actualizado.estado).toBe(false);
      expect(actualizado.grupo).toBe('Bloque A');
    });

    it('rejects when the parametro does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.actualizar('missing', { valor: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('eliminar', () => {
    it('removes an existing parametro', async () => {
      repo.findOne.mockResolvedValue({ id: 'p1' });

      await service.eliminar('p1');

      expect(repo.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1' }),
      );
    });

    it('rejects when the parametro does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.eliminar('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
