import { apiRequest } from './client'

export interface ExportacionDatos {
  generadoEn: string
  titular: { id: string; nombre: string; email: string | null }
  datos: Record<string, Array<Record<string, unknown>>>
  archivos: Array<{ tabla: string; archivo: string }>
}

export function getMisDatos(): Promise<ExportacionDatos> {
  return apiRequest<ExportacionDatos>('/privacidad/mis-datos')
}

export function solicitarSupresion(): Promise<{ success: true }> {
  return apiRequest('/privacidad/solicitar-supresion', { method: 'POST' })
}

export function exportarCoachee(id: string): Promise<ExportacionDatos> {
  return apiRequest<ExportacionDatos>(`/privacidad/coachees/${id}/exportar`)
}

export function suprimirCoachee(id: string, confirmarNombre: string): Promise<{ success: true; archivosBorrados: number }> {
  return apiRequest(`/privacidad/coachees/${id}`, { method: 'DELETE', body: { confirmarNombre } })
}

// La exportación se arma en el navegador a partir del JSON recibido: no pasa por ningún
// servicio externo ni queda copia fuera de la descarga.
export function descargarJson(datos: ExportacionDatos, nombreBase: string): void {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nombreBase}-${datos.generadoEn.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
