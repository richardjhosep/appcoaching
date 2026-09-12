import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { IndicadoresService } from './indicadores.service';
import { IndicadorEconomico } from './entities/indicador-economico.entity';

// "Hoy" fijo — de lo contrario el test de fallback al mes (que filtra por fecha <= hoy)
// quedaría atado a la fecha real en que corre la suite.
jest.mock('../common/chile-time.util', () => ({
  fechaSimpleHoyChile: () => '2026-09-12',
}));

type PartialIndicador = Partial<IndicadorEconomico>;

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  } as Response);
}

describe('IndicadoresService', () => {
  let service: IndicadoresService;
  let repo: {
    findOne: jest.Mock<Promise<PartialIndicador | null>, unknown[]>;
    create: jest.Mock<PartialIndicador, [PartialIndicador]>;
    save: jest.Mock<Promise<PartialIndicador>, [PartialIndicador]>;
  };
  let config: { get: jest.Mock };
  let originalFetch: typeof fetch;

  beforeEach(() => {
    repo = {
      findOne: jest.fn<Promise<PartialIndicador | null>, unknown[]>(),
      create: jest.fn((data: PartialIndicador) => data),
      save: jest.fn((data: PartialIndicador) => Promise.resolve(data)),
    };
    config = { get: jest.fn() };
    service = new IndicadoresService(
      repo as unknown as Repository<IndicadorEconomico>,
      config as unknown as ConfigService,
    );
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getOrFetchHoy', () => {
    it('returns the cached value for today without hitting the CMF', async () => {
      repo.findOne.mockResolvedValue({ valorUf: 39000, fuente: 'cmf' });

      const valor = await service.getOrFetchHoy();

      expect(valor).toEqual(
        expect.objectContaining({
          valorUf: 39000,
          fuente: 'cmf',
          desactualizado: false,
        }),
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('fetches uf and dolar from the CMF and caches both when today is not cached yet', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      config.get.mockReturnValue('fake-key');
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/uf?')) {
          return jsonResponse({
            UFs: [{ Valor: '40.910,10', Fecha: '2026-09-12' }],
          });
        }
        if (url.includes('/dolar?')) {
          return jsonResponse({
            Dolares: [{ Valor: '937,17', Fecha: '2026-09-12' }],
          });
        }
        throw new Error(`unexpected url ${url}`);
      });

      const valor = await service.getOrFetchHoy();

      expect(valor).toEqual(
        expect.objectContaining({
          valorUf: 40910.1,
          fuente: 'cmf',
          desactualizado: false,
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          valorUf: 40910.1,
          valorUsd: 937.17,
          fuente: 'cmf',
        }),
      );
    });

    it('falls back to the current month listing when the CMF has no value for today (e.g. weekend dólar)', async () => {
      repo.findOne.mockResolvedValueOnce(null);
      config.get.mockReturnValue('fake-key');
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/uf?')) {
          return jsonResponse({
            UFs: [{ Valor: '40.910,10', Fecha: '2026-09-12' }],
          });
        }
        if (url.includes('/dolar?')) {
          return jsonResponse({}, false); // 404: "aún no ha sido cargado"
        }
        if (url.includes('/dolar/')) {
          return jsonResponse({
            Dolares: [
              { Valor: '925,97', Fecha: '2026-09-10' },
              { Valor: '937,17', Fecha: '2026-09-11' },
            ],
          });
        }
        throw new Error(`unexpected url ${url}`);
      });

      await service.getOrFetchHoy();

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ valorUsd: 937.17 }),
      );
    });

    it('falls back to the most recent cached value, flagged as desactualizado, when the CMF fails entirely', async () => {
      repo.findOne
        .mockResolvedValueOnce(null) // sin caché de hoy
        .mockResolvedValueOnce({
          fecha: '2026-09-10',
          valorUf: 40800,
          fuente: 'cmf',
        }); // último cacheado
      config.get.mockReturnValue('fake-key');
      (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

      const valor = await service.getOrFetchHoy();

      expect(valor).toEqual(
        expect.objectContaining({
          valorUf: 40800,
          fecha: '2026-09-10',
          desactualizado: true,
        }),
      );
    });

    it('returns null when there is no CMF_API_KEY and nothing was ever cached', async () => {
      repo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      config.get.mockReturnValue(undefined);

      const valor = await service.getOrFetchHoy();

      expect(valor).toBeNull();
    });
  });

  describe('setManualHoy', () => {
    it('creates a new row for today when none exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const valor = await service.setManualHoy(39500);

      expect(valor).toEqual(
        expect.objectContaining({
          valorUf: 39500,
          fuente: 'manual',
          desactualizado: false,
        }),
      );
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ valorUf: 39500, fuente: 'manual' }),
      );
    });

    it('overwrites an existing row for today (even one fetched from the CMF)', async () => {
      const fila: PartialIndicador = {
        fecha: '2026-09-12',
        valorUf: 40910.1,
        fuente: 'cmf',
      };
      repo.findOne.mockResolvedValue(fila);

      await service.setManualHoy(39500);

      expect(fila.valorUf).toBe(39500);
      expect(fila.fuente).toBe('manual');
    });
  });
});
