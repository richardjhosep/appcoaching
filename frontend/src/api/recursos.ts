import { apiRequest, apiUpload, apiDownload } from './client'

export type TipoRecurso = 'archivo' | 'link'

export interface Recurso {
  id: string
  titulo: string
  descripcion: string | null
  etiquetas: string[] | null
  tipo: TipoRecurso
  url: string | null
  archivoNombre: string | null
  archivoPath: string | null
  createdAt: string
}

export interface Asignacion {
  id: string
  recursoId: string
  coacheeId: string
  activa: boolean
  origen: 'coach' | 'autoasignado'
}

export interface Aprendizaje {
  id: string
  recursoId: string
  coacheeId: string
  contenido: string
  createdAt: string
}

export interface CreateRecursoInput {
  titulo: string
  descripcion?: string
  etiquetas?: string
  tipo: TipoRecurso
  url?: string
  archivo?: File
}

export function crearRecurso(input: CreateRecursoInput): Promise<Recurso> {
  const form = new FormData()
  form.set('titulo', input.titulo)
  form.set('tipo', input.tipo)
  if (input.descripcion) form.set('descripcion', input.descripcion)
  if (input.etiquetas) form.set('etiquetas', input.etiquetas)
  if (input.url) form.set('url', input.url)
  if (input.archivo) form.set('archivo', input.archivo)
  return apiUpload<Recurso>('/recursos', form)
}

export function listRecursos(search?: string, etiqueta?: string): Promise<Recurso[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (etiqueta) params.set('etiqueta', etiqueta)
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
): Promise<Asignacion> {
  return apiRequest<Asignacion>(`/recursos/${recursoId}/asignaciones/${coacheeId}`, {
    method: 'PUT',
    body: { activa },
  })
}

export function getAsignacionesDeRecurso(recursoId: string): Promise<Asignacion[]> {
  return apiRequest<Asignacion[]>(`/recursos/${recursoId}/asignaciones`)
}

export function getAprendizajesDeRecurso(recursoId: string): Promise<Aprendizaje[]> {
  return apiRequest<Aprendizaje[]>(`/recursos/${recursoId}/aprendizajes`)
}

export function autoasignarRecurso(recursoId: string): Promise<Asignacion> {
  return apiRequest<Asignacion>(`/recursos/${recursoId}/autoasignar`, { method: 'POST' })
}

export function quitarAutoasignacion(recursoId: string): Promise<void> {
  return apiRequest<void>(`/recursos/${recursoId}/autoasignar`, { method: 'DELETE' })
}

export function addAprendizaje(recursoId: string, contenido: string): Promise<Aprendizaje> {
  return apiRequest<Aprendizaje>(`/recursos/${recursoId}/aprendizajes`, {
    method: 'POST',
    body: { contenido },
  })
}

export function getMisAprendizajes(recursoId: string): Promise<Aprendizaje[]> {
  return apiRequest<Aprendizaje[]>(`/recursos/${recursoId}/aprendizajes/me`)
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
