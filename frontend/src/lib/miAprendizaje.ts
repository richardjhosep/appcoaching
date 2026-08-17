import type { Sesion } from '../api/sesiones'
import type { Recurso } from '../api/recursos'
import type { AprendizajeConRecurso } from '../api/recursos'
import type { QuizResumen } from '../api/quiz'
import type { FlashcardConEstado } from '../api/flashcards'
import type { MapaResumen } from '../api/mapas'
import type { Diario } from '../api/seguimiento'
import type { EstadoPlan } from '../api/planesDesarrollo'

export interface ApunteReciente {
  tipo: 'diario' | 'recurso'
  contenido: string
  fecha: string
  origenLabel?: string
}

export interface ResumenAprendizaje {
  proximaSesion: Sesion | null
  recursos: { total: number; sinApuntes: number }
  quizzes: { total: number; sinResponder: number }
  flashcards: { total: number; paraHoy: number }
  mapas: { total: number }
  apuntesRecientes: ApunteReciente[]
  planPendienteDeAccion: boolean
  vacio: boolean
}

const MAX_APUNTES_RECIENTES = 5

/**
 * Fusiona todo lo que "Mi Aprendizaje" necesita mostrar en un solo view-model —
 * mismo criterio que dashboardAtencion.ts (coach): la lógica de merge vive acá,
 * no inline en la vista, para poder testearla sin montar el componente.
 */
export function resumenAprendizaje(fuentes: {
  sesiones: Sesion[]
  recursos: Recurso[]
  aprendizajes: AprendizajeConRecurso[]
  quizzes: QuizResumen[]
  flashcards: FlashcardConEstado[]
  mapas: MapaResumen[]
  diario: Diario[]
  planEstado: EstadoPlan | null
}): ResumenAprendizaje {
  const ahora = Date.now()
  const proximaSesion =
    fuentes.sesiones
      .filter((s) => new Date(s.fechaHora).getTime() > ahora)
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())[0] ?? null

  // "Sin apuntes" es una aproximación de "pendiente de revisar" — no existe un
  // flag real de "visto" en el modelo, solo si el coachee ya escribió algo.
  const recursosConApuntes = new Set(fuentes.aprendizajes.map((a) => a.recursoId))
  const recursos = {
    total: fuentes.recursos.length,
    sinApuntes: fuentes.recursos.filter((r) => !recursosConApuntes.has(r.id)).length,
  }

  const quizzes = {
    total: fuentes.quizzes.length,
    sinResponder: fuentes.quizzes.filter((q) => q.mejorPuntaje === null).length,
  }

  const flashcards = {
    total: fuentes.flashcards.length,
    paraHoy: fuentes.flashcards.filter((f) => f.debeRepasar).length,
  }

  const mapas = { total: fuentes.mapas.length }

  const apuntesRecientes: ApunteReciente[] = [
    ...fuentes.diario.map((d): ApunteReciente => ({ tipo: 'diario', contenido: d.contenido, fecha: d.createdAt })),
    ...fuentes.aprendizajes.map((a): ApunteReciente => ({
      tipo: 'recurso',
      contenido: a.contenido,
      fecha: a.createdAt,
      origenLabel: a.recurso?.titulo,
    })),
  ]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, MAX_APUNTES_RECIENTES)

  const planPendienteDeAccion = fuentes.planEstado === 'sin_enviar'

  const vacio =
    fuentes.sesiones.length === 0 &&
    fuentes.recursos.length === 0 &&
    fuentes.quizzes.length === 0 &&
    fuentes.flashcards.length === 0 &&
    fuentes.mapas.length === 0 &&
    apuntesRecientes.length === 0

  return { proximaSesion, recursos, quizzes, flashcards, mapas, apuntesRecientes, planPendienteDeAccion, vacio }
}
