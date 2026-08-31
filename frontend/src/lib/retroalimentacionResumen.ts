import type { RespuestaRetroalimentacion } from '../api/retroalimentacion'

export interface PromedioBloque {
  bloque: string
  promedio: number
}

// Promedio 1-5 por bloque, en el orden en que los bloques aparecen por primera vez en
// `respuestas` — reusable tanto por la vista de detalle del coach como por un futuro
// KPI de "feedback promedio" tipo el que muestra el competidor Winston PAD.
export function promedioPorBloque(respuestas: RespuestaRetroalimentacion[]): PromedioBloque[] {
  const bloques: string[] = []
  const sumas = new Map<string, { total: number; count: number }>()
  for (const r of respuestas) {
    if (!sumas.has(r.bloque)) {
      bloques.push(r.bloque)
      sumas.set(r.bloque, { total: 0, count: 0 })
    }
    const acc = sumas.get(r.bloque)!
    acc.total += r.valor
    acc.count += 1
  }
  return bloques.map((bloque) => {
    const acc = sumas.get(bloque)!
    return { bloque, promedio: Math.round((acc.total / acc.count) * 10) / 10 }
  })
}

export function promedioGeneral(respuestas: RespuestaRetroalimentacion[]): number | null {
  if (respuestas.length === 0) return null
  const total = respuestas.reduce((sum, r) => sum + r.valor, 0)
  return Math.round((total / respuestas.length) * 10) / 10
}
