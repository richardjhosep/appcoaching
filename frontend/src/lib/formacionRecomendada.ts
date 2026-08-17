import type { Recurso } from '../api/recursos'
import type { QuizResumen } from '../api/quiz'
import type { FlashcardConEstado } from '../api/flashcards'
import type { MapaResumen } from '../api/mapas'

export interface FormacionRecomendada {
  recursos: Recurso[]
  quizzes: QuizResumen[]
  flashcards: FlashcardConEstado[]
  mapas: MapaResumen[]
  vacio: boolean
}

/**
 * Deriva "Formación complementaria" filtrando contenido que ya se pidió (recursos visibles,
 * quiz/flashcards/mapas disponibles) por la competencia del plan — en vez de que el coach
 * escriba título de libros/artículos a mano. Sin competencia definida en el plan, no hay nada
 * que mostrar todavía (el coachee debe definirla primero en la tab Definición).
 */
export function formacionDe(
  competenciaId: string | null,
  fuentes: {
    recursos: Recurso[]
    quizzes: QuizResumen[]
    flashcards: FlashcardConEstado[]
    mapas: MapaResumen[]
  },
): FormacionRecomendada {
  if (!competenciaId) {
    return { recursos: [], quizzes: [], flashcards: [], mapas: [], vacio: true }
  }

  const recursos = fuentes.recursos.filter((r) => r.competenciaId === competenciaId)
  const quizzes = fuentes.quizzes.filter((q) => q.competenciaId === competenciaId)
  const flashcards = fuentes.flashcards.filter((f) => f.competenciaId === competenciaId)
  const mapas = fuentes.mapas.filter((m) => m.competenciaId === competenciaId)

  return {
    recursos,
    quizzes,
    flashcards,
    mapas,
    vacio: recursos.length === 0 && quizzes.length === 0 && flashcards.length === 0 && mapas.length === 0,
  }
}
