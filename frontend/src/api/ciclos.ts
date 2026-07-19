import { apiRequest, apiUpload, apiDownload } from './client'

export type ResultadoCiclo = 'logrado' | 'medianamente_logrado' | 'no_logrado'

export interface Ciclo {
  id: string
  coacheeId: string
  totalSesiones: number
  fechaApertura: string
  fechaCierre: string | null
  resultado: ResultadoCiclo | null
  resumenReunionInicial: string | null
  informeFinal: string | null
  informePdfNombre: string | null
  informePdfPath: string | null
  sesionesRealizadas: number
  sesionesRestantes: number
  alertaPorVencer: boolean
}

export function abrirCiclo(
  coacheeId: string,
  totalSesiones: number,
  resumenReunionInicial?: string,
): Promise<Ciclo> {
  return apiRequest<Ciclo>('/ciclos', {
    method: 'POST',
    body: { coacheeId, totalSesiones, resumenReunionInicial },
  })
}

export function cerrarCiclo(id: string, resultado: ResultadoCiclo): Promise<Ciclo> {
  return apiRequest<Ciclo>(`/ciclos/${id}/cerrar`, {
    method: 'POST',
    body: { resultado },
  })
}

export function actualizarResumen(id: string, resumenReunionInicial: string): Promise<Ciclo> {
  return apiRequest<Ciclo>(`/ciclos/${id}/resumen-reunion-inicial`, {
    method: 'PATCH',
    body: { resumenReunionInicial },
  })
}

export function actualizarInformeFinal(id: string, informeFinal: string): Promise<Ciclo> {
  return apiRequest<Ciclo>(`/ciclos/${id}/informe-final`, {
    method: 'PATCH',
    body: { informeFinal },
  })
}

export function generarBorradorInforme(id: string): Promise<Ciclo> {
  return apiRequest<Ciclo>(`/ciclos/${id}/generar-borrador-informe`, { method: 'POST' })
}

export function subirInformePdf(id: string, archivo: File): Promise<Ciclo> {
  const form = new FormData()
  form.set('archivo', archivo)
  return apiUpload<Ciclo>(`/ciclos/${id}/informe-pdf`, form)
}

export async function descargarInformePdf(id: string, nombreArchivo: string): Promise<void> {
  const blob = await apiDownload(`/ciclos/${id}/informe-pdf`)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

export function getMisCiclos(): Promise<Ciclo[]> {
  return apiRequest<Ciclo[]>('/ciclos/me')
}

export function getMiCicloActual(): Promise<Ciclo | null> {
  return apiRequest<Ciclo | null>('/ciclos/me/actual')
}

export function getCiclosDeCoachee(coacheeId: string): Promise<Ciclo[]> {
  return apiRequest<Ciclo[]>(`/ciclos/coachee/${coacheeId}`)
}

export function getCicloActualDeCoachee(coacheeId: string): Promise<Ciclo | null> {
  return apiRequest<Ciclo | null>(`/ciclos/coachee/${coacheeId}/actual`)
}

export interface CicloCerrado extends Ciclo {
  coachee: { id: string; nombre: string }
}

export function getCiclosCerrados(): Promise<CicloCerrado[]> {
  return apiRequest<CicloCerrado[]>('/ciclos/cerrados')
}
