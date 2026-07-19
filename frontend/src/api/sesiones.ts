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
  asistio?: boolean | null
  postSesion: PostSesion | null
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
