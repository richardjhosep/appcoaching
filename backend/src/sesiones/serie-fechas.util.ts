import {
  fechaYHoraLocalChile,
  localChileAUtc,
} from '../common/chile-time.util';
import { FrecuenciaSerie } from './enums/frecuencia-serie.enum';

/**
 * Fechas de una serie de sesiones a partir de la primera. Se calcula sobre el calendario y la
 * hora de pared de Chile, no sumando milisegundos fijos: así una serie que cruza el cambio de
 * horario de verano sigue cayendo a la misma hora local (sumar 7×24h la corría una hora), y la
 * mensual cae el mismo día del mes. Si ese día no existe (ej. 31 en un mes de 30), se usa el
 * último día de ese mes.
 */
export function fechasDeSerie(
  primera: Date,
  cantidad: number,
  frecuencia: FrecuenciaSerie,
  intervaloSemanas = 1,
): Date[] {
  const { anio, mes, dia, hora } = fechaYHoraLocalChile(primera);
  const diasEntreSesiones =
    frecuencia === FrecuenciaSerie.QUINCENAL
      ? 14
      : frecuencia === FrecuenciaSerie.PERSONALIZADA
        ? 7 * intervaloSemanas
        : 7;

  return Array.from({ length: cantidad }, (_, i) => {
    if (i === 0) return primera;
    if (frecuencia === FrecuenciaSerie.MENSUAL) {
      // Date.UTC normaliza el desborde de meses (mes 13 → enero del año siguiente).
      const destino = new Date(Date.UTC(anio, mes - 1 + i, 1));
      const ultimoDia = new Date(
        Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0),
      ).getUTCDate();
      return localChileAUtc(
        destino.getUTCFullYear(),
        destino.getUTCMonth() + 1,
        Math.min(dia, ultimoDia),
        hora,
      );
    }
    const destino = new Date(
      Date.UTC(anio, mes - 1, dia + i * diasEntreSesiones),
    );
    return localChileAUtc(
      destino.getUTCFullYear(),
      destino.getUTCMonth() + 1,
      destino.getUTCDate(),
      hora,
    );
  });
}
