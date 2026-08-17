import type { PlanDesarrollo } from '../api/planesDesarrollo'
import type { Ciclo } from '../api/ciclos'
import type { Sesion } from '../api/sesiones'

export type EstadoCoacheeEmpresa = 'sin_iniciar' | 'en_curso' | 'completado'

export interface ResumenCoacheeEmpresa {
  estado: EstadoCoacheeEmpresa
  avance: number | null
  competenciaNombre: string | null
  alertaPorVencer: boolean
  proximaSesionFecha: string | null
}

export interface FuentesResumenCoachee {
  plan: PlanDesarrollo | null
  cicloActual: Ciclo | null
  ciclos: Ciclo[]
  avance: number | null
  proximaSesion: Sesion | null
}

/**
 * Estado derivado solo de datos que el backend ya calcula — no es una máquina de estados
 * nueva: un ciclo abierto manda ("en_curso"), si no hay ninguno pero sí hubo alguno cerrado
 * es "completado", y si nunca hubo ciclo es "sin_iniciar" (aunque ya exista un plan).
 */
export function resumirCoachee(fuentes: FuentesResumenCoachee): ResumenCoacheeEmpresa {
  const { plan, cicloActual, ciclos, avance, proximaSesion } = fuentes

  let estado: EstadoCoacheeEmpresa = 'sin_iniciar'
  if (cicloActual) {
    estado = 'en_curso'
  } else if (ciclos.some((c) => c.fechaCierre)) {
    estado = 'completado'
  }

  return {
    estado,
    avance,
    competenciaNombre: plan?.competencia?.nombre ?? null,
    alertaPorVencer: cicloActual?.alertaPorVencer ?? false,
    proximaSesionFecha: proximaSesion?.fechaHora ?? null,
  }
}
