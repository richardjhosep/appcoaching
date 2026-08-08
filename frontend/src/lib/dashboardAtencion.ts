import type { PlanDesarrollo } from '../api/planesDesarrollo'
import type { Alertas } from '../api/negocio'
import type { IndependienteLegal } from '../api/legal'
import { estadoVisual } from './legalFormat'

export interface CoacheeAtencion {
  coacheeId: string
  nombre: string
  planSinEnviar: boolean
  planPendienteAprobacion: boolean
  cicloPorVencer: { sesionesRestantes: number } | null
  sinProximaSesion: boolean
  sinLogros: boolean
  legalPendiente: boolean
}

/**
 * Fusiona todas las fuentes de "esto necesita algo de mí" en una fila por coachee — un mismo
 * coachee puede traer varias banderas a la vez (ej. sin próxima sesión Y plan sin enviar), y acá
 * aparece una sola vez con todas, en vez de una fila por categoría repitiendo su nombre.
 */
export function coacheesQueNecesitanAlgo(fuentes: {
  planesSinEnviar: PlanDesarrollo[]
  planesPendientesAprobacion: PlanDesarrollo[]
  alertas: Alertas
  independientesLegal: IndependienteLegal[]
}): CoacheeAtencion[] {
  const filas = new Map<string, CoacheeAtencion>()

  function fila(coacheeId: string, nombre: string): CoacheeAtencion {
    const existente = filas.get(coacheeId)
    if (existente) return existente
    const nueva: CoacheeAtencion = {
      coacheeId,
      nombre,
      planSinEnviar: false,
      planPendienteAprobacion: false,
      cicloPorVencer: null,
      sinProximaSesion: false,
      sinLogros: false,
      legalPendiente: false,
    }
    filas.set(coacheeId, nueva)
    return nueva
  }

  for (const p of fuentes.planesSinEnviar) {
    fila(p.coacheeId, p.coachee?.nombre ?? p.coacheeId).planSinEnviar = true
  }
  for (const p of fuentes.planesPendientesAprobacion) {
    fila(p.coacheeId, p.coachee?.nombre ?? p.coacheeId).planPendienteAprobacion = true
  }
  for (const c of fuentes.alertas.ciclosPorVencer) {
    fila(c.coacheeId, c.nombre).cicloPorVencer = { sesionesRestantes: c.sesionesRestantes }
  }
  for (const c of fuentes.alertas.coacheesSinProximaSesion) {
    fila(c.coacheeId, c.nombre).sinProximaSesion = true
  }
  for (const c of fuentes.alertas.coacheesSinLogros) {
    fila(c.coacheeId, c.nombre).sinLogros = true
  }
  for (const i of fuentes.independientesLegal) {
    const pendiente = estadoVisual(i.contrato) !== 'firmado' || estadoVisual(i.nda) !== 'firmado'
    if (pendiente) fila(i.coacheeId, i.nombre).legalPendiente = true
  }

  return Array.from(filas.values())
}
