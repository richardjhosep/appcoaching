export type NivelProgreso = 'alto' | 'medio' | 'bajo'

/**
 * Umbrales sobre una escala 0-100. Se usan tanto para el % de "avance general"
 * como para cercaniaObjetivo*10 (1-10 → 10-100), para que ambos lugares
 * coincidan en qué cuenta como alto/medio/bajo.
 */
export function nivelProgreso(porcentaje: number): NivelProgreso {
  if (porcentaje >= 80) return 'alto'
  if (porcentaje >= 40) return 'medio'
  return 'bajo'
}

export const coloresNivel: Record<NivelProgreso, { fuerte: string; suave: string; texto: string }> = {
  alto: {
    fuerte: 'var(--color-sage)',
    suave: 'color-mix(in srgb, var(--color-sage) 20%, white)',
    texto: 'text-[var(--color-sage)]',
  },
  medio: {
    fuerte: 'var(--color-bronze)',
    suave: 'color-mix(in srgb, var(--color-bronze) 20%, white)',
    texto: 'text-[var(--color-bronze)]',
  },
  bajo: {
    fuerte: 'var(--color-danger)',
    suave: 'color-mix(in srgb, var(--color-danger) 20%, white)',
    texto: 'text-[var(--color-danger)]',
  },
}
