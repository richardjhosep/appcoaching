import type { Sesion } from '../api/sesiones'
import { aFechaLocal } from './dateRange'

export interface DiaConSesiones {
  fecha: string
  sesiones: Sesion[]
}

// Agrupa una lista de sesiones (de cualquier orden) por día calendario local del navegador,
// ordenado por fecha y con las sesiones de cada día ordenadas por hora — para el bloque "Esta
// semana" del dashboard del coach.
export function agruparPorDia(sesiones: Sesion[]): DiaConSesiones[] {
  const grupos = new Map<string, Sesion[]>()
  for (const sesion of sesiones) {
    const fecha = aFechaLocal(new Date(sesion.fechaHora))
    const grupo = grupos.get(fecha) ?? []
    grupo.push(sesion)
    grupos.set(fecha, grupo)
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, sesionesDelDia]) => ({
      fecha,
      sesiones: [...sesionesDelDia].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)),
    }))
}
