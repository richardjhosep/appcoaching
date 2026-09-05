import type { Sesion } from '../api/sesiones'
import type { Recurso } from '../api/recursos'
import type { AprendizajeConRecurso } from '../api/recursos'
import type { QuizResumen } from '../api/quiz'
import type { FlashcardConEstado } from '../api/flashcards'
import type { MapaResumen } from '../api/mapas'
import type { EjercicioResumen } from '../api/ejercicios'
import type { TestEstiloResumen } from '../api/testEstilo'
import type { Diario } from '../api/seguimiento'
import type { EstadoPlan, ActividadEjecucion } from '../api/planesDesarrollo'
import { fechaLimiteVencida } from './fechaLimite'

export interface ApunteReciente {
  tipo: 'diario' | 'recurso'
  contenido: string
  fecha: string
  origenLabel?: string
}

export type TipoTarea = 'actividad' | 'quiz' | 'ejercicios' | 'test-estilo' | 'recurso'

export interface TareaPendiente {
  id: string
  titulo: string
  tipo: TipoTarea
  detalle: string
  urgente: boolean
}

export interface ResumenAprendizaje {
  proximaSesion: Sesion | null
  recursos: { total: number; sinApuntes: number }
  quizzes: { total: number; sinResponder: number }
  flashcards: { total: number; paraHoy: number }
  mapas: { total: number }
  ejercicios: { total: number; sinEntregar: number }
  testEstilo: { total: number; sinResponder: number }
  apuntesRecientes: ApunteReciente[]
  tareasPendientes: TareaPendiente[]
  planPendienteDeAccion: boolean
  vacio: boolean
}

const MAX_APUNTES_RECIENTES = 5
const DIAS_TAREA_PROXIMA = 7

// "Próxima" además de "vencida" — una fecha límite en 3 días no debería aparecer recién
// cuando ya pasó. Mismo umbral usado informalmente en el resto de la app para "urgente".
function fechaLimiteProxima(iso: string | null): boolean {
  if (!iso) return false
  const limiteMs = new Date(iso).getTime()
  const enDias = Date.now() + DIAS_TAREA_PROXIMA * 24 * 60 * 60 * 1000
  return limiteMs <= enDias
}

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
  ejercicios: EjercicioResumen[]
  testEstilo: TestEstiloResumen[]
  diario: Diario[]
  planEstado: EstadoPlan | null
  actividades: ActividadEjecucion[]
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

  const ejercicios = {
    total: fuentes.ejercicios.length,
    sinEntregar: fuentes.ejercicios.filter((e) => e.numeroVersiones === 0).length,
  }

  const testEstilo = {
    total: fuentes.testEstilo.length,
    sinResponder: fuentes.testEstilo.filter((t) => !t.yaRespondido).length,
  }

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

  // "Tareas pendientes": las actividades del plan de ejecución (siempre, no tienen fecha real
  // — el campo es texto libre tipo "Semana 1") + contenido con fecha límite vencida o próxima
  // que el coachee todavía no completó. Flashcards y Mapas quedan fuera de esta lista: son
  // contenido de repaso/exploración continua, sin un estado binario de "completado" que tenga
  // sentido tratar como entregable con plazo.
  const tareasPendientes: TareaPendiente[] = [
    ...fuentes.actividades
      .filter((a) => a.estado !== 'completada')
      .map((a): TareaPendiente => ({
        id: a.id,
        titulo: a.actividad,
        tipo: 'actividad',
        detalle: a.estado === 'en_curso' ? 'En curso' : 'Pendiente',
        urgente: false,
      })),
    ...fuentes.quizzes
      .filter((q) => q.mejorPuntaje === null && fechaLimiteProxima(q.fechaLimite))
      .map((q): TareaPendiente => ({
        id: q.id,
        titulo: q.titulo,
        tipo: 'quiz',
        detalle: fechaLimiteVencida(q.fechaLimite) ? 'Venció' : 'Por vencer',
        urgente: true,
      })),
    ...fuentes.ejercicios
      .filter((e) => e.numeroVersiones === 0 && fechaLimiteProxima(e.fechaLimite))
      .map((e): TareaPendiente => ({
        id: e.id,
        titulo: e.titulo,
        tipo: 'ejercicios',
        detalle: fechaLimiteVencida(e.fechaLimite) ? 'Venció' : 'Por vencer',
        urgente: true,
      })),
    ...fuentes.testEstilo
      .filter((t) => !t.yaRespondido && fechaLimiteProxima(t.fechaLimite))
      .map((t): TareaPendiente => ({
        id: t.id,
        titulo: t.titulo,
        tipo: 'test-estilo',
        detalle: fechaLimiteVencida(t.fechaLimite) ? 'Venció' : 'Por vencer',
        urgente: true,
      })),
    ...fuentes.recursos
      .filter((r) => !recursosConApuntes.has(r.id) && fechaLimiteProxima(r.fechaLimite))
      .map((r): TareaPendiente => ({
        id: r.id,
        titulo: r.titulo,
        tipo: 'recurso',
        detalle: fechaLimiteVencida(r.fechaLimite) ? 'Venció' : 'Por vencer',
        urgente: true,
      })),
  ]

  const planPendienteDeAccion = fuentes.planEstado === 'sin_enviar'

  const vacio =
    fuentes.sesiones.length === 0 &&
    fuentes.recursos.length === 0 &&
    fuentes.quizzes.length === 0 &&
    fuentes.flashcards.length === 0 &&
    fuentes.mapas.length === 0 &&
    fuentes.ejercicios.length === 0 &&
    fuentes.testEstilo.length === 0 &&
    apuntesRecientes.length === 0

  return {
    proximaSesion,
    recursos,
    quizzes,
    flashcards,
    mapas,
    ejercicios,
    testEstilo,
    apuntesRecientes,
    tareasPendientes,
    planPendienteDeAccion,
    vacio,
  }
}
