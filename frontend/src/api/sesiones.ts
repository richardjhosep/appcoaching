import { apiRequest } from './client'

export interface PostSesion {
  id: string
  sesionId: string
  aprendizaje: string | null
  utilidad: number | null
  cercaniaObjetivo: number | null
  recomendacion: string | null
  temasProximaSesion: string | null
  publicada: boolean
  createdAt: string
  updatedAt: string
}

export interface Sesion {
  id: string
  coacheeId: string
  fechaHora: string
  linkVideollamada: string | null
  resumenCompartido: string | null
  notasPrivadas?: string | null
  temaTratado?: string | null
  ejerciciosAplicados?: string | null
  acuerdos?: string | null
  asistio?: boolean | null
  confirmada: boolean
  postSesion: PostSesion | null
  coachee?: { id: string; nombre: string; empresa?: { id: string; nombre: string } | null }
}

export interface UpdatePostSesionInput {
  aprendizaje?: string
  utilidad?: number
  cercaniaObjetivo?: number
  recomendacion?: string
  temasProximaSesion?: string
}

export function getMisSesiones(): Promise<Sesion[]> {
  return apiRequest<Sesion[]>('/sesiones/me')
}

export function getSesionesDeCoachee(coacheeId: string): Promise<Sesion[]> {
  return apiRequest<Sesion[]>(`/sesiones?coacheeId=${coacheeId}`)
}

// Todas las sesiones de todos los coachees, con el nombre de cada uno — para la agenda
// global del coach (/coach/agenda).
export function getTodasLasSesiones(): Promise<Sesion[]> {
  return apiRequest<Sesion[]>('/sesiones/todas')
}

// Sesiones de una ventana de fechas ("YYYY-MM-DD"), con el nombre de cada coachee — para el
// bloque "Esta semana" del dashboard del coach.
export function getSesionesSemana(desde: string, hasta: string): Promise<Sesion[]> {
  return apiRequest<Sesion[]>(`/sesiones/semana?desde=${desde}&hasta=${hasta}`)
}

export function getProximaSesionDeCoachee(coacheeId: string): Promise<Sesion | null> {
  return apiRequest<Sesion | null>(`/sesiones/coachee/${coacheeId}/proxima`)
}

export function agendarSesion(
  coacheeId: string,
  fechaHora: string,
  linkVideollamada?: string,
): Promise<Sesion> {
  return apiRequest<Sesion>('/sesiones', {
    method: 'POST',
    body: { coacheeId, fechaHora, linkVideollamada: linkVideollamada || undefined },
  })
}

export function actualizarAsistencia(sesionId: string, asistio: boolean): Promise<Sesion> {
  return apiRequest<Sesion>(`/sesiones/${sesionId}`, {
    method: 'PATCH',
    body: { asistio },
  })
}

export interface RegistroSesionInput {
  resumenCompartido?: string
  notasPrivadas?: string
  temaTratado?: string
  ejerciciosAplicados?: string
  acuerdos?: string
}

// Registro estructurado de la sesión (plantilla real "Registro de Sesiones" del coach) —
// un solo PATCH para los 5 campos que el coach documenta después de cada sesión.
export function actualizarRegistroSesion(
  sesionId: string,
  input: RegistroSesionInput,
): Promise<Sesion> {
  return apiRequest<Sesion>(`/sesiones/${sesionId}`, {
    method: 'PATCH',
    body: input,
  })
}

export function guardarPostSesion(
  sesionId: string,
  input: UpdatePostSesionInput,
): Promise<PostSesion> {
  return apiRequest<PostSesion>(`/sesiones/${sesionId}/post-sesion`, {
    method: 'PATCH',
    body: input,
  })
}

export function publicarPostSesion(sesionId: string): Promise<PostSesion> {
  return apiRequest<PostSesion>(`/sesiones/${sesionId}/post-sesion/publicar`, {
    method: 'POST',
  })
}

export interface SolicitudReagendamientoResult {
  id: string
  sesionId: string
  coacheeId: string
  motivo: string | null
  estado: 'pendiente' | 'resuelta'
  createdAt: string
}

export function confirmarSesion(sesionId: string): Promise<Sesion> {
  return apiRequest<Sesion>(`/sesiones/${sesionId}/confirmar`, { method: 'POST' })
}

export function solicitarReagendamiento(
  sesionId: string,
  motivo?: string,
): Promise<SolicitudReagendamientoResult> {
  return apiRequest<SolicitudReagendamientoResult>(`/sesiones/${sesionId}/reagendamiento`, {
    method: 'POST',
    body: { motivo: motivo || undefined },
  })
}
