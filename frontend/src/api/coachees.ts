import { apiRequest, apiUpload, apiDownload } from './client'

export interface CoacheeListItem {
  id: string
  nombre: string
  empresaId: string | null
  empresa?: { id: string; nombre: string } | null
  user?: { id: string; email: string } | null
  tarifaPropia?: number | null
  jefeDirecto?: string | null
  objetivoProceso?: string | null
  areaGerencia?: string | null
  activo?: boolean
  consentimientoInformado: boolean
  consentimientoFecha: string | null
  createdAt?: string
}

export interface CreateCoacheeInput {
  nombre: string
  email: string
  empresaId?: string
  jefeDirecto?: string
  objetivoProceso?: string
  tarifaPropia?: number
  areaGerencia?: string
}

export interface UpdateCoacheeInput {
  nombre?: string
  empresaId?: string | null
  jefeDirecto?: string
  objetivoProceso?: string
  tarifaPropia?: number
  areaGerencia?: string
}

export interface CreateCoacheeResult {
  coachee: CoacheeListItem
  temporaryPassword: string | null
}

export interface Coachee {
  id: string
  nombre: string
  empresaId: string | null
  empresa?: { id: string; nombre: string } | null
  // El backend ya lo incluye (relación user siempre cargada) — sólo faltaba declararlo acá.
  user?: { id: string; email: string } | null
  telefono: string | null
  emailContacto: string | null
  jefeDirecto?: string | null
  objetivoProceso?: string | null
  tarifaPropia?: number | null
  areaGerencia?: string | null
  activo?: boolean
  fotoPath: string | null
  fotoNombre: string | null
  bio: string | null
  compartirPerfilConCoach: boolean
  consentimientoInformado: boolean
  consentimientoFecha: string | null
}

export function listCoachees(): Promise<CoacheeListItem[]> {
  return apiRequest<CoacheeListItem[]>('/coachees')
}

export function createCoachee(input: CreateCoacheeInput): Promise<CreateCoacheeResult> {
  return apiRequest<CreateCoacheeResult>('/coachees', { method: 'POST', body: input })
}

export function updateCoachee(id: string, input: UpdateCoacheeInput): Promise<CoacheeListItem> {
  return apiRequest<CoacheeListItem>(`/coachees/${id}`, { method: 'PATCH', body: input })
}

export function setCoacheeActivo(id: string, activo: boolean): Promise<CoacheeListItem> {
  return apiRequest<CoacheeListItem>(`/coachees/${id}/estado`, { method: 'PATCH', body: { activo } })
}

export function deleteCoachee(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/coachees/${id}`, { method: 'DELETE' })
}

export function getMyCoachee(): Promise<Coachee> {
  return apiRequest<Coachee>('/coachees/me')
}

export function getCoachee(id: string): Promise<Coachee> {
  return apiRequest<Coachee>(`/coachees/${id}`)
}

export function setConsentimiento(id: string, informado: boolean): Promise<CoacheeListItem> {
  return apiRequest<CoacheeListItem>(`/coachees/${id}/consentimiento`, {
    method: 'PATCH',
    body: { informado },
  })
}

export function solicitarConsentimiento(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/coachees/${id}/consentimiento/solicitar`, {
    method: 'POST',
  })
}

export interface UpdateMiPerfilInput {
  telefono?: string
  emailContacto?: string
  bio?: string
  compartirPerfilConCoach?: boolean
}

export function actualizarMiPerfil(input: UpdateMiPerfilInput): Promise<Coachee> {
  return apiRequest<Coachee>('/coachees/me/perfil', { method: 'PATCH', body: input })
}

export function subirFotoCoachee(archivo: File): Promise<Coachee> {
  const form = new FormData()
  form.set('archivo', archivo)
  return apiUpload<Coachee>('/coachees/me/foto', form)
}

/** Blob URL de la propia foto del coachee — null si todavía no tiene una (404 silenciado,
 * mismo criterio que obtenerUrlFoto en api/perfilCoach.ts). */
export async function obtenerUrlMiFotoCoachee(): Promise<string | null> {
  try {
    const blob = await apiDownload('/coachees/me/foto')
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

/** Blob URL de la foto de un coachee específico — usado por el coach en PerfilTab.vue, solo
 * cuando el coachee activó compartirPerfilConCoach (el frontend decide si llama esto). */
export async function obtenerUrlFotoDeCoachee(id: string): Promise<string | null> {
  try {
    const blob = await apiDownload(`/coachees/${id}/foto`)
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}
