import { apiRequest } from './client'

export interface RespuestaRetroalimentacion {
  bloque: string
  afirmacion: string
  valor: number
}

export interface RetroalimentacionCierre {
  id: string
  coacheeId: string
  cicloId: string
  respuestas: RespuestaRetroalimentacion[]
  loQueMasGusto: string | null
  mayoresAprendizajes: string | null
  sugerencias: string | null
  otrosComentarios: string | null
  createdAt: string
}

export interface CreateRetroalimentacionInput {
  cicloId: string
  respuestas: RespuestaRetroalimentacion[]
  loQueMasGusto?: string
  mayoresAprendizajes?: string
  sugerencias?: string
  otrosComentarios?: string
}

export function crearRetroalimentacion(
  input: CreateRetroalimentacionInput,
): Promise<RetroalimentacionCierre> {
  return apiRequest<RetroalimentacionCierre>('/retroalimentacion', {
    method: 'POST',
    body: input,
  })
}

export function getMisRetroalimentaciones(): Promise<RetroalimentacionCierre[]> {
  return apiRequest<RetroalimentacionCierre[]>('/retroalimentacion/me')
}

export function getRetroalimentacionesDeCoachee(
  coacheeId: string,
): Promise<RetroalimentacionCierre[]> {
  return apiRequest<RetroalimentacionCierre[]>(`/retroalimentacion/coachee/${coacheeId}`)
}
