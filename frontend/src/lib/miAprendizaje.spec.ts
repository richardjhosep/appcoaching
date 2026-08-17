import { describe, it, expect } from 'vitest'
import { resumenAprendizaje } from './miAprendizaje'
import type { Sesion } from '../api/sesiones'
import type { Recurso, AprendizajeConRecurso } from '../api/recursos'
import type { QuizResumen } from '../api/quiz'
import type { FlashcardConEstado } from '../api/flashcards'
import type { MapaResumen } from '../api/mapas'
import type { Diario } from '../api/seguimiento'

function fuentesVacias() {
  return {
    sesiones: [] as Sesion[],
    recursos: [] as Recurso[],
    aprendizajes: [] as AprendizajeConRecurso[],
    quizzes: [] as QuizResumen[],
    flashcards: [] as FlashcardConEstado[],
    mapas: [] as MapaResumen[],
    diario: [] as Diario[],
    planEstado: null,
  }
}

describe('resumenAprendizaje', () => {
  it('is vacio when every source is empty', () => {
    expect(resumenAprendizaje(fuentesVacias()).vacio).toBe(true)
  })

  it('picks the closest future sesion as proximaSesion, ignoring past ones', () => {
    const pasada = { id: 's1', fechaHora: '2000-01-01T00:00:00.000Z' } as Sesion
    const lejana = { id: 's2', fechaHora: '2099-06-01T00:00:00.000Z' } as Sesion
    const cercana = { id: 's3', fechaHora: '2099-01-01T00:00:00.000Z' } as Sesion

    const resumen = resumenAprendizaje({ ...fuentesVacias(), sesiones: [pasada, lejana, cercana] })

    expect(resumen.proximaSesion?.id).toBe('s3')
  })

  it('counts recursos without any aprendizaje as sinApuntes', () => {
    const recursos = [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }] as Recurso[]
    const aprendizajes = [{ recursoId: 'r1' }] as AprendizajeConRecurso[]

    const resumen = resumenAprendizaje({ ...fuentesVacias(), recursos, aprendizajes })

    expect(resumen.recursos).toEqual({ total: 3, sinApuntes: 2 })
  })

  it('counts quizzes with mejorPuntaje=null as sinResponder', () => {
    const quizzes = [
      { id: 'q1', mejorPuntaje: null },
      { id: 'q2', mejorPuntaje: 3 },
    ] as QuizResumen[]

    const resumen = resumenAprendizaje({ ...fuentesVacias(), quizzes })

    expect(resumen.quizzes).toEqual({ total: 2, sinResponder: 1 })
  })

  it('counts flashcards with debeRepasar=true as paraHoy', () => {
    const flashcards = [
      { id: 'f1', debeRepasar: true },
      { id: 'f2', debeRepasar: false },
    ] as FlashcardConEstado[]

    const resumen = resumenAprendizaje({ ...fuentesVacias(), flashcards })

    expect(resumen.flashcards).toEqual({ total: 2, paraHoy: 1 })
  })

  it('merges diario and aprendizajes into apuntesRecientes, newest first, capped at 5', () => {
    const diario = [{ contenido: 'reflexión', createdAt: '2026-01-02T00:00:00.000Z' }] as Diario[]
    const aprendizajes = [
      { contenido: 'nota vieja', createdAt: '2026-01-01T00:00:00.000Z', recurso: { titulo: 'Guía' } },
      { contenido: 'nota nueva', createdAt: '2026-01-03T00:00:00.000Z', recurso: { titulo: 'Guía 2' } },
    ] as AprendizajeConRecurso[]

    const resumen = resumenAprendizaje({ ...fuentesVacias(), diario, aprendizajes })

    expect(resumen.apuntesRecientes.map((a) => a.contenido)).toEqual([
      'nota nueva',
      'reflexión',
      'nota vieja',
    ])
    expect(resumen.apuntesRecientes[0].origenLabel).toBe('Guía 2')
  })

  it('marks planPendienteDeAccion only when the plan is sin_enviar', () => {
    expect(resumenAprendizaje({ ...fuentesVacias(), planEstado: 'sin_enviar' }).planPendienteDeAccion).toBe(true)
    expect(resumenAprendizaje({ ...fuentesVacias(), planEstado: 'aprobado' }).planPendienteDeAccion).toBe(false)
  })
})
