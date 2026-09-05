import type { ResultadoCiclo } from '../api/ciclos'

export const resultadoLabel: Record<ResultadoCiclo, string> = {
  logrado: 'Logrado',
  medianamente_logrado: 'Medianamente logrado',
  no_logrado: 'No logrado',
}

/** Mismo criterio sage/bronze/danger de siempre para resultado de un ciclo — para que el
 * badge "Logrado"/"No logrado" comunique de un vistazo, no solo con texto. */
export const resultadoColor: Record<ResultadoCiclo, string> = {
  logrado: 'var(--color-sage)',
  medianamente_logrado: 'var(--color-bronze)',
  no_logrado: 'var(--color-danger)',
}
