import { apiRequest } from './client'

export type TipoDocumentoLegal = 'contrato' | 'nda'
export type EstadoDocumentoLegal = 'firmado' | 'pendiente'

export interface DocumentoLegal {
  estado: EstadoDocumentoLegal
  fecha: string | null
  vigencia: string | null
}

export interface EmpresaLegal {
  empresaId: string
  nombre: string
  contrato: DocumentoLegal
  nda: DocumentoLegal
  coacheesConConsentimiento: number
  coacheesTotal: number
}

export interface MedidaCumplimiento {
  id: string
  descripcion: string
  activa: boolean
}

export function getResumenLegal(): Promise<EmpresaLegal[]> {
  return apiRequest<EmpresaLegal[]>('/legal/resumen')
}

export function getCumplimiento(): Promise<MedidaCumplimiento[]> {
  return apiRequest<MedidaCumplimiento[]>('/legal/cumplimiento')
}

export function upsertDocumentoLegal(
  empresaId: string,
  tipo: TipoDocumentoLegal,
  input: { estado: EstadoDocumentoLegal; fecha?: string; vigencia?: string },
): Promise<DocumentoLegal> {
  return apiRequest<DocumentoLegal>(`/legal/documentos/${empresaId}/${tipo}`, {
    method: 'PUT',
    body: input,
  })
}
