import { apiRequest } from './client'

export type ResultadoRepaso = 'facil' | 'dificil' | 'olvidado'

export interface Flashcard {
  id: string
  anverso: string
  reverso: string
  competenciaId: string
  competencia?: { id: string; nombre: string }
  recursoId: string | null
  recurso?: { id: string; titulo: string } | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface FlashcardConEstado {
  id: string
  anverso: string
  reverso: string
  competenciaId: string
  competencia?: { id: string; nombre: string }
  recursoId: string | null
  activo: boolean
  proximaRevision: string | null
  debeRepasar: boolean
}

export interface Repaso {
  id: string
  flashcardId: string
  flashcard?: Flashcard
  coacheeId: string
  resultado: ResultadoRepaso
  proximaRevision: string
  createdAt: string
}

// --- Coach ---

export function createFlashcard(input: {
  anverso: string
  reverso: string
  competenciaId: string
  recursoId?: string
}): Promise<Flashcard> {
  return apiRequest<Flashcard>('/flashcards', { method: 'POST', body: input })
}

export function listFlashcards(): Promise<Flashcard[]> {
  return apiRequest<Flashcard[]>('/flashcards')
}

export function getFlashcard(id: string): Promise<Flashcard> {
  return apiRequest<Flashcard>(`/flashcards/${id}`)
}

export function updateFlashcard(
  id: string,
  input: Partial<{ anverso: string; reverso: string; competenciaId: string; recursoId: string }>,
): Promise<Flashcard> {
  return apiRequest<Flashcard>(`/flashcards/${id}`, { method: 'PATCH', body: input })
}

export function setFlashcardActivo(id: string, isActive: boolean): Promise<Flashcard> {
  return apiRequest<Flashcard>(`/flashcards/${id}/estado`, { method: 'PATCH', body: { isActive } })
}

export function deleteFlashcard(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/flashcards/${id}`, { method: 'DELETE' })
}

// --- Coachee ---

export function listFlashcardsDisponibles(): Promise<FlashcardConEstado[]> {
  return apiRequest<FlashcardConEstado[]>('/flashcards/disponibles')
}

export function registrarRepaso(id: string, resultado: ResultadoRepaso): Promise<Repaso> {
  return apiRequest<Repaso>(`/flashcards/${id}/repasos`, { method: 'POST', body: { resultado } })
}

export function misRepasos(): Promise<Repaso[]> {
  return apiRequest<Repaso[]>('/flashcards/mis-repasos')
}
