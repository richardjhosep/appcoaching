import { aFechaLocal } from './dateRange'

/** "Vence: 15 oct 2026", o null si no tiene fecha límite. */
export function formatearFechaLimite(iso: string | null): string | null {
  if (!iso) return null
  return `Vence: ${new Date(iso).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`
}

/** true si la fecha límite ya pasó. */
export function fechaLimiteVencida(iso: string | null): boolean {
  return iso !== null && new Date(iso).getTime() < Date.now()
}

/** ISO -> "YYYY-MM-DD" para el value de un <input type="date">. */
export function aInputDate(iso: string | null): string {
  return iso ? aFechaLocal(new Date(iso)) : ''
}
