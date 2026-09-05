import {
  diaYHoraLocalChile,
  finDelDiaChileAUtc,
  inicioDelDiaChileAUtc,
  localChileAUtc,
  sumarDiasFechaSimple,
} from './chile-time.util';

describe('chile-time.util', () => {
  it('convierte ida y vuelta sin perder el día ni la hora de pared', () => {
    // 2026-03-09 es lunes.
    const utc = localChileAUtc(2026, 3, 9, '15:30');
    expect(diaYHoraLocalChile(utc)).toEqual({ diaSemana: 1, hora: '15:30' });
  });

  it('funciona igual para un horario que cruza medianoche UTC', () => {
    // 21:30 en Chile cae ya en el día calendario siguiente en UTC — el caso que rompería una
    // implementación que usara Date.getDay()/getHours() nativos en un proceso con TZ=UTC.
    // 2026-06-10 es miércoles.
    const utc = localChileAUtc(2026, 6, 10, '21:30');
    expect(diaYHoraLocalChile(utc)).toEqual({ diaSemana: 3, hora: '21:30' });
    expect(utc.getUTCDate()).not.toBe(10);
  });

  it('difiere de lo que devolvería un getDay()/getHours() nativo del mismo instante', () => {
    const utc = localChileAUtc(2026, 6, 10, '21:30');
    const horaUtcNativa = `${utc.getUTCHours()}:${String(utc.getUTCMinutes()).padStart(2, '0')}`;
    expect(horaUtcNativa).not.toBe(diaYHoraLocalChile(utc).hora);
    expect(utc.getUTCDay()).not.toBe(diaYHoraLocalChile(utc).diaSemana);
  });

  describe('finDelDiaChileAUtc', () => {
    it('interpreta la fecha como el fin del día (23:59) en horario de Chile', () => {
      const utc = finDelDiaChileAUtc('2026-10-15');
      expect(diaYHoraLocalChile(utc).hora).toBe('23:59');
    });

    it('sigue considerando visible ese contenido a las 22:00 hora Chile del mismo día', () => {
      // Un ejemplo concreto de por qué no se puede usar medianoche UTC directo: las 22:00
      // hora de Chile del día 15 ya son el día 16 en UTC — comparar contra
      // new Date("2026-10-15") (medianoche UTC) marcaría el contenido como vencido a esa hora,
      // cuando en realidad todavía falta casi 2 horas para que termine el día en Chile.
      const limite = finDelDiaChileAUtc('2026-10-15');
      const alas22Chile = localChileAUtc(2026, 10, 15, '22:00');
      expect(alas22Chile.getTime()).toBeLessThan(limite.getTime());
    });
  });

  describe('inicioDelDiaChileAUtc', () => {
    it('interpreta la fecha como el inicio del día (00:00) en horario de Chile', () => {
      const utc = inicioDelDiaChileAUtc('2026-10-15');
      expect(diaYHoraLocalChile(utc).hora).toBe('00:00');
    });
  });

  describe('sumarDiasFechaSimple', () => {
    it('suma días cruzando el fin de mes', () => {
      expect(sumarDiasFechaSimple('2026-01-31', 1)).toBe('2026-02-01');
    });

    it('resta días cruzando el inicio de mes', () => {
      expect(sumarDiasFechaSimple('2026-03-01', -1)).toBe('2026-02-28');
    });

    it('con 0 días devuelve la misma fecha', () => {
      expect(sumarDiasFechaSimple('2026-06-15', 0)).toBe('2026-06-15');
    });
  });
});
