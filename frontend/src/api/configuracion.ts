import { apiRequest } from './client'

export interface ParametroConfiguracion {
  id: string
  grupo: string
  clave: string
  valor: string
  estado: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateParametroInput {
  grupo: string
  clave: string
  valor: string
  estado?: boolean
}

export interface UpdateParametroInput {
  grupo?: string
  clave?: string
  valor?: string
  estado?: boolean
}

export interface PreguntaRetroalimentacion {
  bloque: string
  afirmacion: string
}

export function listarParametros(grupo?: string): Promise<ParametroConfiguracion[]> {
  const query = grupo ? `?grupo=${encodeURIComponent(grupo)}` : ''
  return apiRequest<ParametroConfiguracion[]>(`/configuracion${query}`)
}

export function crearParametro(input: CreateParametroInput): Promise<ParametroConfiguracion> {
  return apiRequest<ParametroConfiguracion>('/configuracion', {
    method: 'POST',
    body: input,
  })
}

export function actualizarParametro(
  id: string,
  input: UpdateParametroInput,
): Promise<ParametroConfiguracion> {
  return apiRequest<ParametroConfiguracion>(`/configuracion/${id}`, {
    method: 'PATCH',
    body: input,
  })
}

export function eliminarParametro(id: string): Promise<void> {
  return apiRequest<void>(`/configuracion/${id}`, { method: 'DELETE' })
}

export function getPreguntasRetroalimentacion(): Promise<PreguntaRetroalimentacion[]> {
  return apiRequest<PreguntaRetroalimentacion[]>('/configuracion/retroalimentacion/preguntas')
}

export function getCategoriasSatisfaccion(): Promise<string[]> {
  return apiRequest<string[]>('/configuracion/satisfaccion/categorias')
}
