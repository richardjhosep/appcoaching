import { apiRequest } from './client'

export interface PreguntaEstilo {
  id: string
  testEstiloId: string
  opcionA: string
  categoriaA: string
  opcionB: string
  categoriaB: string
  orden: number
  createdAt: string
}

// Versión que ve el coachee antes de responder — nunca incluye categoriaA/categoriaB
// (mostrarlas de antemano sesgaría la respuesta de un instrumento de autopercepción).
export interface PreguntaEstiloParaResponder {
  id: string
  opcionA: string
  opcionB: string
  orden: number
}

export interface TestEstilo {
  id: string
  titulo: string
  descripcion: string | null
  competenciaId: string | null
  competencia?: { id: string; nombre: string }
  activo: boolean
  fechaLimite: string | null
  createdAt: string
  updatedAt: string
}

export interface TestEstiloConPreguntas extends TestEstilo {
  preguntas: PreguntaEstilo[]
}

export interface TestEstiloParaResponder {
  id: string
  titulo: string
  descripcion: string | null
  competenciaId: string | null
  preguntas: PreguntaEstiloParaResponder[]
}

export interface TestEstiloResumen {
  id: string
  titulo: string
  descripcion: string | null
  competenciaId: string | null
  competencia?: { id: string; nombre: string }
  activo: boolean
  fechaLimite: string | null
  createdAt: string
  totalPreguntas: number
  yaRespondido: boolean
  miCategoriaDominante: string | null
}

export interface IntentoEstilo {
  id: string
  testEstiloId: string
  testEstilo?: TestEstilo
  coacheeId: string
  coachee?: { id: string; nombre: string }
  respuestas: ('A' | 'B')[]
  resultado: Record<string, number>
  categoriaDominante: string
  createdAt: string
}

// --- Coach ---

export function createTestEstilo(input: {
  titulo: string
  descripcion?: string
  competenciaId?: string
  fechaLimite?: string
}): Promise<TestEstilo> {
  return apiRequest<TestEstilo>('/tests-estilo', { method: 'POST', body: input })
}

export function listTestsEstilo(): Promise<TestEstilo[]> {
  return apiRequest<TestEstilo[]>('/tests-estilo')
}

export function getTestEstiloParaCoach(id: string): Promise<TestEstiloConPreguntas> {
  return apiRequest<TestEstiloConPreguntas>(`/tests-estilo/${id}`)
}

export function updateTestEstilo(
  id: string,
  input: Partial<{
    titulo: string
    descripcion: string
    competenciaId: string
    fechaLimite: string | null
  }>,
): Promise<TestEstilo> {
  return apiRequest<TestEstilo>(`/tests-estilo/${id}`, { method: 'PATCH', body: input })
}

export function setTestEstiloActivo(id: string, isActive: boolean): Promise<TestEstilo> {
  return apiRequest<TestEstilo>(`/tests-estilo/${id}/estado`, {
    method: 'PATCH',
    body: { isActive },
  })
}

export function deleteTestEstilo(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/tests-estilo/${id}`, { method: 'DELETE' })
}

export function addPreguntaEstilo(
  testEstiloId: string,
  input: { opcionA: string; categoriaA: string; opcionB: string; categoriaB: string },
): Promise<PreguntaEstilo> {
  return apiRequest<PreguntaEstilo>(`/tests-estilo/${testEstiloId}/preguntas`, {
    method: 'POST',
    body: input,
  })
}

export function deletePreguntaEstilo(preguntaId: string): Promise<void> {
  return apiRequest<void>(`/tests-estilo/preguntas/${preguntaId}`, { method: 'DELETE' })
}

export function listIntentosDeTestEstilo(testEstiloId: string): Promise<IntentoEstilo[]> {
  return apiRequest<IntentoEstilo[]>(`/tests-estilo/${testEstiloId}/intentos`)
}

// --- Coachee ---

export function listTestsEstiloDisponibles(): Promise<TestEstiloResumen[]> {
  return apiRequest<TestEstiloResumen[]>('/tests-estilo/disponibles')
}

export function getTestEstiloParaResponder(id: string): Promise<TestEstiloParaResponder> {
  return apiRequest<TestEstiloParaResponder>(`/tests-estilo/${id}`)
}

export function enviarIntentoEstilo(
  id: string,
  respuestas: ('A' | 'B')[],
): Promise<IntentoEstilo> {
  return apiRequest<IntentoEstilo>(`/tests-estilo/${id}/intentos`, {
    method: 'POST',
    body: { respuestas },
  })
}

export function misIntentosEstilo(): Promise<IntentoEstilo[]> {
  return apiRequest<IntentoEstilo[]>('/tests-estilo/mis-intentos')
}
