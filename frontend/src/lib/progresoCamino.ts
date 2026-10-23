import type { PuntoProgreso } from '../api/seguimiento'
import { nivelProgreso, type NivelProgreso } from './nivelProgreso'

// Frase en lenguaje llano para cada nivel (mismos umbrales que nivelProgreso: 40 y 80 sobre 100,
// o sea 4 y 8 sobre 10). Nunca se usa solo el color para comunicar el estado.
export const FRASE_NIVEL: Record<NivelProgreso, string> = {
  alto: 'Muy cerca de tu objetivo',
  medio: 'Avanzando hacia tu objetivo',
  bajo: 'Recién comenzando el camino',
}

export interface VariacionProgreso {
  /** Cambio respecto a la sesión anterior (null si solo hay una sesión). */
  respectoAnterior: number | null
  /** Cambio respecto a la primera sesión (null si hay menos de 3: sería igual al anterior). */
  desdeInicio: number | null
}

export function ordenarPorFecha(puntos: PuntoProgreso[]): PuntoProgreso[] {
  return [...puntos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
}

export function variacion(puntos: PuntoProgreso[]): VariacionProgreso {
  const asc = ordenarPorFecha(puntos)
  if (asc.length < 2) return { respectoAnterior: null, desdeInicio: null }
  const ultimo = asc[asc.length - 1]!
  const anterior = asc[asc.length - 2]!
  const primero = asc[0]!
  return {
    respectoAnterior: ultimo.cercaniaObjetivo - anterior.cercaniaObjetivo,
    desdeInicio: asc.length >= 3 ? ultimo.cercaniaObjetivo - primero.cercaniaObjetivo : null,
  }
}

/** "+2", "−1" (signo menos real) o "0". */
export function formatoDelta(delta: number): string {
  if (delta > 0) return `+${delta}`
  if (delta < 0) return `−${Math.abs(delta)}`
  return '0'
}

export function resumenAccesible(puntos: PuntoProgreso[]): string {
  const asc = ordenarPorFecha(puntos)
  if (asc.length === 0) return 'Sin sesiones evaluadas todavía.'
  const ultimo = asc[asc.length - 1]!
  if (asc.length === 1) return `Punto de partida: ${ultimo.cercaniaObjetivo} sobre 10 en tu primera sesión.`
  const primero = asc[0]!
  return `Evolución de tu cercanía al objetivo en ${asc.length} sesiones: de ${primero.cercaniaObjetivo} a ${ultimo.cercaniaObjetivo} sobre 10.`
}

export function nivelDePunto(p: PuntoProgreso): NivelProgreso {
  return nivelProgreso(p.cercaniaObjetivo * 10)
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
/** Los tooltips de ECharts interpretan HTML: el texto libre del coachee debe ir escapado. */
export function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ESCAPES[c]!)
}
