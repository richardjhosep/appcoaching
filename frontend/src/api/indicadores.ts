import { apiRequest } from './client'

export interface ValorUf {
  valorUf: number
  fecha: string
  fuente: string
  /** true si la CMF no respondió hoy y se está mostrando el último valor cacheado. */
  desactualizado: boolean
}

export function getUfHoy(): Promise<ValorUf> {
  return apiRequest<ValorUf>('/indicadores/uf')
}

/** Fallback manual — el coach lo tipea si la CMF está caída o si todavía no se
 * configuró la API key. */
export function setUfManual(valorUf: number): Promise<ValorUf> {
  return apiRequest<ValorUf>('/indicadores/uf/manual', { method: 'POST', body: { valorUf } })
}
