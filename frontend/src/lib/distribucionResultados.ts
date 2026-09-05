import type { ResultadoCiclo } from '../api/ciclos'

export interface SegmentoResultado {
  resultado: ResultadoCiclo
  count: number
  pct: number
}

// Orden fijo (no alfabético): de mejor a peor resultado, para que la dona y su leyenda se
// lean siempre en el mismo sentido — igual criterio que el resto de la app usa para
// logrado/medianamente_logrado/no_logrado (ver lib/resultadoCiclo.ts).
const ORDEN: ResultadoCiclo[] = ['logrado', 'medianamente_logrado', 'no_logrado']

/**
 * Desglose de resultados para la dona de "Retorno de la inversión" — antes era un solo
 * "% con objetivo logrado", que escondía cuántos procesos quedaron parciales o sin lograr.
 * Los resultados sin ningún proceso no aparecen (una dona con un segmento en 0% no aporta).
 */
export function distribucionResultadosSegments(
  distribucion: Record<ResultadoCiclo, number>,
): SegmentoResultado[] {
  const total = ORDEN.reduce((suma, r) => suma + distribucion[r], 0)
  if (total === 0) return []

  return ORDEN.filter((r) => distribucion[r] > 0).map((r) => ({
    resultado: r,
    count: distribucion[r],
    pct: Math.round((distribucion[r] / total) * 100),
  }))
}
