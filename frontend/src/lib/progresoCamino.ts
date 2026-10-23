import type { PuntoProgreso } from '../api/seguimiento'
import { nivelProgreso, type NivelProgreso } from './nivelProgreso'

/** Quién mira: el propio coachee ("tu") o el coach/empresa hablando de un coachee ("su"). */
export type Audiencia = 'propio' | 'coachee'

// Textos en lenguaje llano. Las frases de nivel usan los mismos umbrales que nivelProgreso (40 y
// 80 sobre 100, o sea 4 y 8 sobre 10) y NUNCA se comunica el estado solo con el color.
export function textos(audiencia: Audiencia) {
  const propio = audiencia === 'propio'
  return {
    frase: {
      alto: propio ? 'Muy cerca de tu objetivo' : 'Muy cerca de su objetivo',
      medio: propio ? 'Avanzando hacia tu objetivo' : 'Avanzando hacia su objetivo',
      bajo: propio ? 'Recién comenzando el camino' : 'Recién comenzando el camino',
    } satisfies Record<NivelProgreso, string>,
    captionConFecha: (fecha: string) =>
      propio
        ? `Tu autoevaluación al cerrar la sesión del ${fecha}.`
        : `Autoevaluación del coachee al cerrar la sesión del ${fecha}.`,
    captionSinFecha: propio ? 'Tu última autoevaluación.' : 'Última autoevaluación del coachee.',
    anterior: propio ? 'respecto a tu sesión anterior' : 'respecto a la sesión anterior',
    igual: propio ? 'Igual que en tu sesión anterior' : 'Igual que en la sesión anterior',
    desdeInicio: propio ? 'Desde tu primera sesión:' : 'Desde la primera sesión:',
    partida: propio ? 'Este es tu punto de partida' : 'Este es el punto de partida',
    partidaAyuda: propio
      ? 'Con tu próxima sesión empezaremos a dibujar tu evolución y podrás ver cuánto avanzas.'
      : 'Con la próxima sesión empezará a dibujarse su evolución.',
    vacio: propio
      ? 'Tu progreso empieza en tu próxima sesión: al publicar tu post-sesión verás aquí cómo avanzas.'
      : 'Aún no hay autoevaluaciones: se completan cuando el coachee publica un post-sesión.',
  }
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

export function resumenAccesible(puntos: PuntoProgreso[], audiencia: Audiencia = 'propio'): string {
  const asc = ordenarPorFecha(puntos)
  if (asc.length === 0) return 'Sin sesiones evaluadas todavía.'
  const ultimo = asc[asc.length - 1]!
  const de = audiencia === 'propio' ? 'tu' : 'su'
  if (asc.length === 1) return `Punto de partida: ${ultimo.cercaniaObjetivo} sobre 10 en ${de} primera sesión.`
  const primero = asc[0]!
  return `Evolución de ${de} cercanía al objetivo en ${asc.length} sesiones: de ${primero.cercaniaObjetivo} a ${ultimo.cercaniaObjetivo} sobre 10.`
}

export function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}
export function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function nivelDePunto(p: PuntoProgreso): NivelProgreso {
  return nivelProgreso(p.cercaniaObjetivo * 10)
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
/** Los tooltips de ECharts interpretan HTML: el texto libre del coachee debe ir escapado. */
export function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ESCAPES[c]!)
}
