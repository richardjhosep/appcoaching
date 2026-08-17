import { apiRequest } from './client'

export interface Pregunta {
  id: string
  quizId: string
  enunciado: string
  opciones: string[]
  respuestaCorrecta: number
  orden: number
  createdAt: string
}

// Versión que ve el coachee antes de responder — nunca incluye respuestaCorrecta.
export interface PreguntaParaResponder {
  id: string
  enunciado: string
  opciones: string[]
  orden: number
}

export interface Quiz {
  id: string
  titulo: string
  competenciaId: string
  competencia?: { id: string; nombre: string }
  recursoId: string | null
  recurso?: { id: string; titulo: string } | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface QuizConPreguntas extends Quiz {
  preguntas: Pregunta[]
}

export interface QuizParaResponder {
  id: string
  titulo: string
  competenciaId: string
  recursoId: string | null
  preguntas: PreguntaParaResponder[]
}

export interface QuizResumen {
  id: string
  titulo: string
  competenciaId: string
  competencia?: { id: string; nombre: string }
  recursoId: string | null
  activo: boolean
  createdAt: string
  totalPreguntas: number
  mejorPuntaje: number | null
}

export interface Intento {
  id: string
  quizId: string
  quiz?: Quiz
  coacheeId: string
  coachee?: { id: string; nombre: string }
  respuestas: number[]
  puntaje: number
  totalPreguntas: number
  createdAt: string
}

export interface ResultadoIntento {
  puntaje: number
  totalPreguntas: number
  detalle: { preguntaId: string; correcta: boolean; respuestaCorrecta: number }[]
}

// --- Coach ---

export function createQuiz(input: {
  titulo: string
  competenciaId: string
  recursoId?: string
}): Promise<Quiz> {
  return apiRequest<Quiz>('/quizzes', { method: 'POST', body: input })
}

export function listQuizzes(): Promise<Quiz[]> {
  return apiRequest<Quiz[]>('/quizzes')
}

export function getQuizParaCoach(id: string): Promise<QuizConPreguntas> {
  return apiRequest<QuizConPreguntas>(`/quizzes/${id}`)
}

export function updateQuiz(
  id: string,
  input: Partial<{ titulo: string; competenciaId: string; recursoId: string }>,
): Promise<Quiz> {
  return apiRequest<Quiz>(`/quizzes/${id}`, { method: 'PATCH', body: input })
}

export function setQuizActivo(id: string, isActive: boolean): Promise<Quiz> {
  return apiRequest<Quiz>(`/quizzes/${id}/estado`, { method: 'PATCH', body: { isActive } })
}

export function deleteQuiz(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/quizzes/${id}`, { method: 'DELETE' })
}

export function addPregunta(
  quizId: string,
  input: { enunciado: string; opciones: string[]; respuestaCorrecta: number },
): Promise<Pregunta> {
  return apiRequest<Pregunta>(`/quizzes/${quizId}/preguntas`, { method: 'POST', body: input })
}

export function updatePregunta(
  preguntaId: string,
  input: Partial<{ enunciado: string; opciones: string[]; respuestaCorrecta: number }>,
): Promise<Pregunta> {
  return apiRequest<Pregunta>(`/quizzes/preguntas/${preguntaId}`, { method: 'PATCH', body: input })
}

export function deletePregunta(preguntaId: string): Promise<void> {
  return apiRequest<void>(`/quizzes/preguntas/${preguntaId}`, { method: 'DELETE' })
}

export function listIntentosDeQuiz(quizId: string): Promise<Intento[]> {
  return apiRequest<Intento[]>(`/quizzes/${quizId}/intentos`)
}

// --- Coachee ---

export function listQuizzesDisponibles(): Promise<QuizResumen[]> {
  return apiRequest<QuizResumen[]>('/quizzes/disponibles')
}

export function getQuizParaResponder(id: string): Promise<QuizParaResponder> {
  return apiRequest<QuizParaResponder>(`/quizzes/${id}`)
}

export function enviarIntento(id: string, respuestas: number[]): Promise<ResultadoIntento> {
  return apiRequest<ResultadoIntento>(`/quizzes/${id}/intentos`, {
    method: 'POST',
    body: { respuestas },
  })
}

export function misIntentos(): Promise<Intento[]> {
  return apiRequest<Intento[]>('/quizzes/mis-intentos')
}
