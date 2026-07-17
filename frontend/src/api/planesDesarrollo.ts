import { apiRequest } from './client'

export type EstadoPlan = 'sin_enviar' | 'pendiente_aprobacion' | 'aprobado' | 'cambios_solicitados'
export type EstadoActividad = 'pendiente' | 'en_curso' | 'completada'

export interface ObjetivoEspecifico {
  id: string
  descripcion: string
  orden: number
}

export interface ActividadEjecucion {
  id: string
  objetivoId: string
  actividad: string
  fechaInicio: string | null
  fechaFin: string | null
  estado: EstadoActividad
}

export interface CoacheeResumen {
  id: string
  nombre: string
}

export interface PlanDesarrollo {
  id: string
  coacheeId: string
  coachee?: CoacheeResumen
  competenciaId: string | null
  nivelActual: number | null
  nivelObjetivo: number | null
  plazo: string | null
  descripcionEstadoActual: string | null
  objetivoGeneral: string | null
  estado: EstadoPlan
  comentarioCoach: string | null
  habitoCuando: string | null
  habitoEnVezDe: string | null
  habitoVoyA: string | null
  habitoObvio: string | null
  habitoSencillo: string | null
  habitoAtractivo: string | null
  habitoSatisfactorio: string | null
  formacionLibros: string | null
  formacionArticulos: string | null
  formacionVideos: string | null
  formacionPodcasts: string | null
  formacionPracticaGuiada: string | null
  objetivos: ObjetivoEspecifico[]
  actividades: ActividadEjecucion[]
  createdAt: string
  updatedAt: string
}

export type UpdatePlanInput = Partial<
  Pick<
    PlanDesarrollo,
    | 'competenciaId'
    | 'nivelActual'
    | 'nivelObjetivo'
    | 'plazo'
    | 'descripcionEstadoActual'
    | 'objetivoGeneral'
    | 'habitoCuando'
    | 'habitoEnVezDe'
    | 'habitoVoyA'
    | 'habitoObvio'
    | 'habitoSencillo'
    | 'habitoAtractivo'
    | 'habitoSatisfactorio'
    | 'formacionLibros'
    | 'formacionArticulos'
    | 'formacionVideos'
    | 'formacionPodcasts'
    | 'formacionPracticaGuiada'
  >
>

export interface CreateActividadInput {
  objetivoId: string
  actividad: string
  fechaInicio?: string
  fechaFin?: string
  estado?: EstadoActividad
}

export function getOwnPlan(): Promise<PlanDesarrollo> {
  return apiRequest<PlanDesarrollo>('/planes-desarrollo/me')
}

export function updateOwnPlan(input: UpdatePlanInput): Promise<PlanDesarrollo> {
  return apiRequest<PlanDesarrollo>('/planes-desarrollo/me', { method: 'PATCH', body: input })
}

export function enviarPlan(): Promise<PlanDesarrollo> {
  return apiRequest<PlanDesarrollo>('/planes-desarrollo/me/enviar', { method: 'POST' })
}

export function addObjetivo(descripcion: string): Promise<ObjetivoEspecifico> {
  return apiRequest<ObjetivoEspecifico>('/planes-desarrollo/me/objetivos', {
    method: 'POST',
    body: { descripcion },
  })
}

export function updateObjetivo(id: string, descripcion: string): Promise<ObjetivoEspecifico> {
  return apiRequest<ObjetivoEspecifico>(`/planes-desarrollo/me/objetivos/${id}`, {
    method: 'PATCH',
    body: { descripcion },
  })
}

export function removeObjetivo(id: string): Promise<void> {
  return apiRequest<void>(`/planes-desarrollo/me/objetivos/${id}`, { method: 'DELETE' })
}

export function addActividad(input: CreateActividadInput): Promise<ActividadEjecucion> {
  return apiRequest<ActividadEjecucion>('/planes-desarrollo/me/actividades', {
    method: 'POST',
    body: input,
  })
}

export function updateActividad(
  id: string,
  input: Partial<CreateActividadInput>,
): Promise<ActividadEjecucion> {
  return apiRequest<ActividadEjecucion>(`/planes-desarrollo/me/actividades/${id}`, {
    method: 'PATCH',
    body: input,
  })
}

export function removeActividad(id: string): Promise<void> {
  return apiRequest<void>(`/planes-desarrollo/me/actividades/${id}`, { method: 'DELETE' })
}

export function listPlanes(estado?: EstadoPlan): Promise<PlanDesarrollo[]> {
  const query = estado ? `?estado=${estado}` : ''
  return apiRequest<PlanDesarrollo[]>(`/planes-desarrollo${query}`)
}

export function getPlanByCoachee(coacheeId: string): Promise<PlanDesarrollo> {
  return apiRequest<PlanDesarrollo>(`/planes-desarrollo/${coacheeId}`)
}

export function aprobarPlan(coacheeId: string): Promise<PlanDesarrollo> {
  return apiRequest<PlanDesarrollo>(`/planes-desarrollo/${coacheeId}/aprobar`, { method: 'POST' })
}

export function solicitarCambios(coacheeId: string, comentario: string): Promise<PlanDesarrollo> {
  return apiRequest<PlanDesarrollo>(`/planes-desarrollo/${coacheeId}/solicitar-cambios`, {
    method: 'POST',
    body: { comentario },
  })
}
