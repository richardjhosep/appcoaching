import type { LocationQuery, LocationQueryRaw } from 'vue-router'

/** Primer valor de un parámetro de query como texto ('' si falta). */
export function leerTexto(q: LocationQuery, clave: string): string {
  const v = q[clave]
  const primero = Array.isArray(v) ? v[0] : v
  return typeof primero === 'string' ? primero : ''
}

/** Entero positivo de un parámetro de query (`porDefecto` si falta o es inválido). */
export function leerEntero(q: LocationQuery, clave: string, porDefecto = 1): number {
  const n = Number.parseInt(leerTexto(q, clave), 10)
  return Number.isInteger(n) && n > 0 ? n : porDefecto
}

/**
 * Query a escribir: conserva los parámetros ajenos a `estado` y solo incluye los que difieren
 * de su valor por defecto (URL limpia cuando no hay filtros).
 */
export function armarQuery(
  actual: LocationQuery,
  estado: Record<string, string | number>,
  defectos: Record<string, string | number> = {},
): LocationQueryRaw {
  const resto: LocationQueryRaw = { ...actual }
  for (const clave of Object.keys(estado)) delete resto[clave]
  for (const [clave, valor] of Object.entries(estado)) {
    if (String(valor) !== String(defectos[clave] ?? '')) resto[clave] = String(valor)
  }
  return resto
}
