import { apiRequest, apiUpload, apiDownload, ApiError } from './client'

export interface CertificacionCoach {
  id: string
  nombre: string
  entidadEmisora: string | null
  fecha: string | null
  archivoPath: string | null
  archivoNombre: string | null
  createdAt: string
}

export interface ExperienciaCoach {
  id: string
  empresa: string
  cargo: string | null
  fechaInicio: string
  fechaFin: string | null
  descripcion: string | null
  logoPath: string | null
  logoNombre: string | null
  createdAt: string
}

export interface PerfilCoach {
  id: string
  coachUserId: string
  nombre: string
  titulo: string | null
  bio: string | null
  linkedinUrl: string | null
  sitioWeb: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  youtubeUrl: string | null
  telefono: string | null
  emailContacto: string | null
  metodologia: string | null
  fotoPath: string | null
  fotoNombre: string | null
  cvPath: string | null
  cvNombre: string | null
  certificaciones?: CertificacionCoach[]
  experiencias?: ExperienciaCoach[]
  createdAt: string
  updatedAt: string
}

export interface UpdatePerfilCoachInput {
  nombre?: string
  titulo?: string
  bio?: string
  linkedinUrl?: string
  sitioWeb?: string
  instagramUrl?: string
  facebookUrl?: string
  youtubeUrl?: string
  telefono?: string
  emailContacto?: string
  metodologia?: string
}

export interface CreateCertificacionInput {
  nombre: string
  entidadEmisora?: string
  fecha?: string
  archivo?: File
}

export interface CreateExperienciaInput {
  empresa: string
  cargo?: string
  fechaInicio: string
  fechaFin?: string
  descripcion?: string
  logo?: File
}

function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

/** Mi propio perfil (coach), crea uno vacío en el primer acceso. */
export function getMiPerfil(): Promise<PerfilCoach> {
  return apiRequest<PerfilCoach>('/perfil-coach/me')
}

export function updateMiPerfil(input: UpdatePerfilCoachInput): Promise<PerfilCoach> {
  return apiRequest<PerfilCoach>('/perfil-coach/me', { method: 'PATCH', body: input })
}

export function subirFoto(archivo: File): Promise<PerfilCoach> {
  const form = new FormData()
  form.set('archivo', archivo)
  return apiUpload<PerfilCoach>('/perfil-coach/me/foto', form)
}

export function subirCv(archivo: File): Promise<PerfilCoach> {
  const form = new FormData()
  form.set('archivo', archivo)
  return apiUpload<PerfilCoach>('/perfil-coach/me/cv', form)
}

export function agregarCertificacion(input: CreateCertificacionInput): Promise<CertificacionCoach> {
  const form = new FormData()
  form.set('nombre', input.nombre)
  if (input.entidadEmisora) form.set('entidadEmisora', input.entidadEmisora)
  if (input.fecha) form.set('fecha', input.fecha)
  if (input.archivo) form.set('archivo', input.archivo)
  return apiUpload<CertificacionCoach>('/perfil-coach/me/certificaciones', form)
}

export function eliminarCertificacion(id: string): Promise<void> {
  return apiRequest<void>(`/perfil-coach/me/certificaciones/${id}`, { method: 'DELETE' })
}

export function agregarExperiencia(input: CreateExperienciaInput): Promise<ExperienciaCoach> {
  const form = new FormData()
  form.set('empresa', input.empresa)
  if (input.cargo) form.set('cargo', input.cargo)
  form.set('fechaInicio', input.fechaInicio)
  if (input.fechaFin) form.set('fechaFin', input.fechaFin)
  if (input.descripcion) form.set('descripcion', input.descripcion)
  if (input.logo) form.set('logo', input.logo)
  return apiUpload<ExperienciaCoach>('/perfil-coach/me/experiencias', form)
}

export function eliminarExperiencia(id: string): Promise<void> {
  return apiRequest<void>(`/perfil-coach/me/experiencias/${id}`, { method: 'DELETE' })
}

/** URL de imagen "en vivo" (blob) para el logo de una experiencia, o null si no tiene o falla
 * la carga — mismo criterio que `obtenerUrlFoto`, para que el llamador muestre el fallback de
 * inicial sin manejar el error explícitamente. */
export async function obtenerUrlLogoExperiencia(id: string): Promise<string | null> {
  try {
    const blob = await apiDownload(`/perfil-coach/experiencias/${id}/logo`)
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

/** Perfil del coach, de solo lectura — usado por coachee y empresa. */
export function getPerfilCoach(): Promise<PerfilCoach> {
  return apiRequest<PerfilCoach>('/perfil-coach')
}

/** URL de imagen "en vivo" (blob) para mostrar inline con <img>, o null si no hay foto
 * o si falla la carga — no lanza, para que el llamador pueda mostrar el fallback de
 * iniciales sin manejar el error explícitamente. */
export async function obtenerUrlFoto(): Promise<string | null> {
  try {
    const blob = await apiDownload('/perfil-coach/foto')
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

export async function descargarCv(nombreArchivo: string): Promise<void> {
  const blob = await apiDownload('/perfil-coach/cv')
  descargarBlob(blob, nombreArchivo)
}

export async function descargarCertificacion(id: string, nombreArchivo: string): Promise<void> {
  const blob = await apiDownload(`/perfil-coach/certificaciones/${id}/archivo`)
  descargarBlob(blob, nombreArchivo)
}

export function esNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404
}
