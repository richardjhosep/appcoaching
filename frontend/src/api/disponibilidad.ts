import { apiRequest } from './client'

export interface BloqueDisponibilidad {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  createdAt: string
}

export function listBloquesDisponibilidad(): Promise<BloqueDisponibilidad[]> {
  return apiRequest<BloqueDisponibilidad[]>('/disponibilidad')
}

export function crearBloqueDisponibilidad(
  diaSemana: number,
  horaInicio: string,
  horaFin: string,
): Promise<BloqueDisponibilidad> {
  return apiRequest<BloqueDisponibilidad>('/disponibilidad', {
    method: 'POST',
    body: { diaSemana, horaInicio, horaFin },
  })
}

export function eliminarBloqueDisponibilidad(id: string): Promise<void> {
  return apiRequest<void>(`/disponibilidad/${id}`, { method: 'DELETE' })
}

// `desde`/`hasta` van como fecha calendario "YYYY-MM-DD".
export async function getSlotsLibres(desde: string, hasta: string): Promise<string[]> {
  return apiRequest<string[]>(`/disponibilidad/slots?desde=${desde}&hasta=${hasta}`)
}
