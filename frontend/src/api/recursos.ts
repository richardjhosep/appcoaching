import { apiRequest, apiUpload, apiDownload } from './client'

export type TipoRecurso = 'archivo' | 'link'

export interface Recurso {
  id: string
  titulo: string
  descripcion: string | null
  carpetaId: string
  competenciaId: string | null
  competencia?: { id: string; nombre: string }
  tipo: TipoRecurso
  url: string | null
  archivoNombre: string | null
  archivoPath: string | null
  fechaLimite: string | null
  createdAt: string
}

export interface Asignacion {
  id: string
  recursoId: string
  coacheeId: string
  activa: boolean
  expiraEn: string | null
}

export interface Aprendizaje {
  id: string
  recursoId: string
  coacheeId: string
  contenido: string
  aplicacion: string | null
  createdAt: string
}

export interface CreateRecursoInput {
  titulo: string
  descripcion?: string
  carpetaId: string
  competenciaId?: string
  tipo: TipoRecurso
  url?: string
  archivo?: File
  fechaLimite?: string
}

export function crearRecurso(input: CreateRecursoInput): Promise<Recurso> {
  const form = new FormData()
  form.set('titulo', input.titulo)
  form.set('tipo', input.tipo)
  form.set('carpetaId', input.carpetaId)
  if (input.descripcion) form.set('descripcion', input.descripcion)
  if (input.competenciaId) form.set('competenciaId', input.competenciaId)
  if (input.url) form.set('url', input.url)
  if (input.archivo) form.set('archivo', input.archivo)
  if (input.fechaLimite) form.set('fechaLimite', input.fechaLimite)
  return apiUpload<Recurso>('/recursos', form)
}

export function updateRecurso(
  id: string,
  input: Partial<{
    titulo: string
    descripcion: string
    carpetaId: string
    competenciaId: string
    fechaLimite: string | null
  }>,
): Promise<Recurso> {
  return apiRequest<Recurso>(`/recursos/${id}`, { method: 'PATCH', body: input })
}

export function listRecursos(carpetaId?: string, search?: string): Promise<Recurso[]> {
  const params = new URLSearchParams()
  if (carpetaId) params.set('carpetaId', carpetaId)
  if (search) params.set('search', search)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<Recurso[]>(`/recursos${query}`)
}

export function getMisRecursos(): Promise<Recurso[]> {
  return apiRequest<Recurso[]>('/recursos/me')
}

export function removeRecurso(id: string): Promise<void> {
  return apiRequest<void>(`/recursos/${id}`, { method: 'DELETE' })
}

export function asignarRecurso(
  recursoId: string,
  coacheeId: string,
  activa: boolean,
  expiraEn?: string | null,
): Promise<Asignacion> {
  return apiRequest<Asignacion>(`/recursos/${recursoId}/asignaciones/${coacheeId}`, {
    method: 'PUT',
    body: { activa, expiraEn },
  })
}

export function getAsignacionesDeRecurso(recursoId: string): Promise<Asignacion[]> {
  return apiRequest<Asignacion[]>(`/recursos/${recursoId}/asignaciones`)
}

export function getAprendizajesDeRecurso(recursoId: string): Promise<Aprendizaje[]> {
  return apiRequest<Aprendizaje[]>(`/recursos/${recursoId}/aprendizajes`)
}

export function addAprendizaje(
  recursoId: string,
  contenido: string,
  aplicacion?: string,
): Promise<Aprendizaje> {
  return apiRequest<Aprendizaje>(`/recursos/${recursoId}/aprendizajes`, {
    method: 'POST',
    body: { contenido, aplicacion: aplicacion || undefined },
  })
}

export function getMisAprendizajes(recursoId: string): Promise<Aprendizaje[]> {
  return apiRequest<Aprendizaje[]>(`/recursos/${recursoId}/aprendizajes/me`)
}

export interface AprendizajeConRecurso extends Aprendizaje {
  recurso?: { id: string; titulo: string }
}

// Junta las notas de TODOS los recursos del coachee (a diferencia de getMisAprendizajes,
// que es siempre de uno solo) — usado por "Mi Aprendizaje".
export function listMisAprendizajes(): Promise<AprendizajeConRecurso[]> {
  return apiRequest<AprendizajeConRecurso[]>('/recursos/aprendizajes/me')
}

export async function descargarArchivo(recursoId: string, nombreArchivo: string): Promise<void> {
  const blob = await apiDownload(`/recursos/${recursoId}/archivo`)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}
