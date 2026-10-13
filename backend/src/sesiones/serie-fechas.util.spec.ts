import { fechasDeSerie } from './serie-fechas.util';
import { FrecuenciaSerie } from './enums/frecuencia-serie.enum';

const iso = (d: Date) => d.toISOString();

describe('fechasDeSerie', () => {
  // 2026-08-20 10:00 en Chile (invierno, UTC-4) = 14:00Z.
  const primera = new Date('2026-08-20T14:00:00.000Z');

  it('semanal: misma hora local aunque la serie cruce el inicio del horario de verano', () => {
    // Chile pasa a UTC-3 el primer domingo de septiembre de 2026: desde ahí, las 10:00 locales
    // son las 13:00Z. Sumar 7×24h fijas habría dejado la sesión a las 11:00 locales.
    const fechas = fechasDeSerie(primera, 4, FrecuenciaSerie.SEMANAL);
    expect(fechas.map(iso)).toEqual([
      '2026-08-20T14:00:00.000Z',
      '2026-08-27T14:00:00.000Z',
      '2026-09-03T14:00:00.000Z',
      '2026-09-10T13:00:00.000Z',
    ]);
  });

  it('quincenal: cada 14 días', () => {
    const fechas = fechasDeSerie(primera, 3, FrecuenciaSerie.QUINCENAL);
    expect(fechas.map((d) => iso(d).slice(0, 10))).toEqual([
      '2026-08-20',
      '2026-09-03',
      '2026-09-17',
    ]);
  });

  it('personalizada: cada N semanas', () => {
    const fechas = fechasDeSerie(primera, 3, FrecuenciaSerie.PERSONALIZADA, 3);
    expect(fechas.map((d) => iso(d).slice(0, 10))).toEqual([
      '2026-08-20',
      '2026-09-10',
      '2026-10-01',
    ]);
  });

  it('mensual: mismo día del mes, cruzando de año', () => {
    const fechas = fechasDeSerie(
      new Date('2026-11-15T13:00:00.000Z'),
      3,
      FrecuenciaSerie.MENSUAL,
    );
    expect(fechas.map((d) => iso(d).slice(0, 10))).toEqual([
      '2026-11-15',
      '2026-12-15',
      '2027-01-15',
    ]);
  });

  it('mensual: un día 31 cae al último día de los meses más cortos', () => {
    // 31-ene-2027 10:00 en Chile (verano, UTC-3) = 13:00Z.
    const fechas = fechasDeSerie(
      new Date('2027-01-31T13:00:00.000Z'),
      3,
      FrecuenciaSerie.MENSUAL,
    );
    expect(fechas.map((d) => iso(d).slice(0, 10))).toEqual([
      '2027-01-31',
      '2027-02-28',
      '2027-03-31',
    ]);
  });
});
