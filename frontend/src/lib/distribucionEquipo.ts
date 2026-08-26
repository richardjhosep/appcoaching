const SIN_AREA = 'Sin asignar'

export interface SegmentoArea {
  area: string
  count: number
  pct: number
}

/**
 * Agrupa coachees por área/gerencia para el donut de "Distribución por departamento"
 * de la vista de empresa. Los que no tienen área cargada aún (dato incompleto, normal
 * mientras se completa la ficha de cada coachee) se agrupan en "Sin asignar" en vez de
 * excluirse, así el total del centro del donut siempre coincide con el conteo real.
 */
export function distribucionPorArea(coachees: { areaGerencia?: string | null }[]): SegmentoArea[] {
  const total = coachees.length
  if (total === 0) return []

  const grupos = new Map<string, number>()
  for (const c of coachees) {
    const area = c.areaGerencia?.trim() || SIN_AREA
    grupos.set(area, (grupos.get(area) ?? 0) + 1)
  }

  return Array.from(grupos.entries())
    .map(([area, count]) => ({ area, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count || a.area.localeCompare(b.area))
}

export interface CompetenciaTrabajada {
  competencia: string
  count: number
  coachees: string[]
}

/**
 * Agrupa coachees por la competencia de su plan de desarrollo actual, para el gráfico
 * de barras "Competencias trabajadas". Coachees sin competencia asignada (sin plan enviado
 * aún) se excluyen — a diferencia del área, acá no tiene sentido un balde "sin asignar"
 * porque el gráfico responde "qué se está trabajando", no "cuántos coachees hay".
 */
export function competenciasTrabajadas(
  filas: { competenciaNombre: string | null; coacheeNombre: string }[],
): CompetenciaTrabajada[] {
  const grupos = new Map<string, string[]>()
  for (const { competenciaNombre, coacheeNombre } of filas) {
    if (!competenciaNombre) continue
    const lista = grupos.get(competenciaNombre) ?? []
    lista.push(coacheeNombre)
    grupos.set(competenciaNombre, lista)
  }

  return Array.from(grupos.entries())
    .map(([competencia, coachees]) => ({ competencia, count: coachees.length, coachees }))
    .sort((a, b) => b.count - a.count || a.competencia.localeCompare(b.competencia))
}
