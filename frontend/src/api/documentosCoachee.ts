import { apiDownload, apiRequest, apiUpload } from './client'
import type { Role } from './auth'

export type TipoDocumentoCoachee = 'cv' | 'evaluacion_desempeno' | 'descriptor_cargo' | 'otro'

export const TIPOS_DOCUMENTO_COACHEE: { valor: TipoDocumentoCoachee; label: string; basico: boolean }[] = [
  { valor: 'cv', label: 'Currículum vitae', basico: true },
  { valor: 'evaluacion_desempeno', label: 'Evaluación de desempeño', basico: true },
  { valor: 'descriptor_cargo', label: 'Descriptor de cargo', basico: true },
  { valor: 'otro', label: 'Otro documento', basico: false },
]

// Compartidos entre coach, coachee y empresa: lo que sube uno lo ven los otros dos.
export interface DocumentoCoachee {
  id: string
  coacheeId: string
  tipo: TipoDocumentoCoachee
  descripcion: string | null
  archivoNombre: string
  subidoPorUserId: string
  subidoPorRol: Role
  createdAt: string
}

export interface SubirDocumentoInput {
  tipo: TipoDocumentoCoachee
  descripcion?: string
  archivo: File
}

// Sin coacheeId = los propios del coachee logueado (el backend lo resuelve desde el JWT).
function base(coacheeId?: string): string {
  return coacheeId ? `/documentos-coachee/coachee/${coacheeId}` : '/documentos-coachee/me'
}

export function listarDocumentosCoachee(coacheeId?: string): Promise<DocumentoCoachee[]> {
  return apiRequest<DocumentoCoachee[]>(base(coacheeId))
}

export function subirDocumentoCoachee(input: SubirDocumentoInput, coacheeId?: string): Promise<DocumentoCoachee> {
  const form = new FormData()
  form.set('tipo', input.tipo)
  if (input.descripcion) form.set('descripcion', input.descripcion)
  form.set('archivo', input.archivo)
  return apiUpload<DocumentoCoachee>(base(coacheeId), form)
}

export function eliminarDocumentoCoachee(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/documentos-coachee/${id}`, { method: 'DELETE' })
}

export async function descargarDocumentoCoachee(doc: DocumentoCoachee): Promise<void> {
  const blob = await apiDownload(`/documentos-coachee/${doc.id}/archivo`)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = doc.archivoNombre
  a.click()
  URL.revokeObjectURL(url)
}
