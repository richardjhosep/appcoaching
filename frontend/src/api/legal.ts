import { apiRequest, apiUpload, apiDownload } from './client'

export type TipoDocumentoLegal = 'contrato' | 'nda'
export type EstadoDocumentoLegal = 'firmado' | 'pendiente'

export interface DocumentoLegal {
  estado: EstadoDocumentoLegal
  fecha: string | null
  vigencia: string | null
  tieneArchivo: boolean
}

export interface EmpresaLegal {
  empresaId: string
  nombre: string
  contrato: DocumentoLegal
  nda: DocumentoLegal
  coacheesConConsentimiento: number
  coacheesTotal: number
  createdAt: string
}

export interface IndependienteLegal {
  coacheeId: string
  nombre: string
  contrato: DocumentoLegal
  nda: DocumentoLegal
  consentimientoInformado: boolean
  createdAt: string
}

export interface ResumenLegal {
  empresas: EmpresaLegal[]
  independientes: IndependienteLegal[]
}

export interface MedidaCumplimiento {
  id: string
  descripcion: string
  activa: boolean
}

export interface DocumentoAdicionalLegal {
  id: string
  empresaId: string | null
  coacheeId: string | null
  titulo: string
  archivoNombre: string
  createdAt: string
}

/** Exactamente uno de los dos — empresa cliente o coachee independiente. */
export type TargetLegal = { empresaId: string } | { coacheeId: string }

function targetPath(target: TargetLegal): string {
  return 'empresaId' in target ? `empresa/${target.empresaId}` : `coachee/${target.coacheeId}`
}

function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

export function getResumenLegal(): Promise<ResumenLegal> {
  return apiRequest<ResumenLegal>('/legal/resumen')
}

export function getCumplimiento(): Promise<MedidaCumplimiento[]> {
  return apiRequest<MedidaCumplimiento[]>('/legal/cumplimiento')
}

export function upsertDocumentoLegal(
  target: TargetLegal,
  tipo: TipoDocumentoLegal,
  input: { estado: EstadoDocumentoLegal; fecha?: string; vigencia?: string; archivo?: File },
): Promise<DocumentoLegal> {
  const form = new FormData()
  form.set('estado', input.estado)
  if (input.fecha) form.set('fecha', input.fecha)
  if (input.vigencia) form.set('vigencia', input.vigencia)
  if (input.archivo) form.set('archivo', input.archivo)
  return apiUpload<DocumentoLegal>(`/legal/documentos/${targetPath(target)}/${tipo}`, form, 'PUT')
}

export async function descargarAcuerdo(
  target: TargetLegal,
  tipo: TipoDocumentoLegal,
  nombreArchivo: string,
): Promise<void> {
  const blob = await apiDownload(`/legal/documentos/${targetPath(target)}/${tipo}/archivo`)
  descargarBlob(blob, nombreArchivo)
}

export function listarAdicionales(): Promise<DocumentoAdicionalLegal[]> {
  return apiRequest<DocumentoAdicionalLegal[]>('/legal/adicionales')
}

export function subirAdicional(
  target: TargetLegal,
  titulo: string,
  archivo: File,
): Promise<DocumentoAdicionalLegal> {
  const form = new FormData()
  form.set('titulo', titulo)
  form.set('archivo', archivo)
  return apiUpload<DocumentoAdicionalLegal>(`/legal/adicionales/${targetPath(target)}`, form)
}

export async function descargarAdicional(id: string, nombreArchivo: string): Promise<void> {
  const blob = await apiDownload(`/legal/adicionales/${id}/archivo`)
  descargarBlob(blob, nombreArchivo)
}

export function eliminarAdicional(id: string): Promise<void> {
  return apiRequest<void>(`/legal/adicionales/${id}`, { method: 'DELETE' })
}

export interface MisDocumentosLegales {
  contrato: DocumentoLegal
  nda: DocumentoLegal
  alcance: 'empresa' | 'individual'
}

/** Solo lectura, del propio coachee — "empresa" si el contrato/NDA es el de su empresa con el
 * coach, "individual" si es propio (coachee independiente). */
export function getMisDocumentosLegales(): Promise<MisDocumentosLegales> {
  return apiRequest<MisDocumentosLegales>('/legal/documentos/me')
}

export async function descargarMiAcuerdo(tipo: TipoDocumentoLegal, nombreArchivo: string): Promise<void> {
  const blob = await apiDownload(`/legal/documentos/me/${tipo}/archivo`)
  descargarBlob(blob, nombreArchivo)
}
