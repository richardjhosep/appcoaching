export interface FilaPerfil {
  categoria: string
  conteo: number
  max: number
}

/**
 * Convierte el `resultado` de un intento ({categoria: conteo}) en filas ordenadas de mayor
 * a menor conteo, con `max` (el mayor conteo del set) para dibujar barras proporcionales.
 * Reusado por la vista del coach (perfil de cada coachee) y la del coachee (su propio perfil).
 */
export function categoriasDe(resultado: Record<string, number>): FilaPerfil[] {
  const valores = Object.values(resultado)
  const max = valores.length > 0 ? Math.max(...valores) : 0
  return Object.entries(resultado)
    .sort((a, b) => b[1] - a[1])
    .map(([categoria, conteo]) => ({ categoria, conteo, max }))
}
