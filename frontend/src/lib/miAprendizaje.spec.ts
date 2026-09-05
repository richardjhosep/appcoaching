import { describe, it, expect } from 'vitest'
import { resumenAprendizaje } from './miAprendizaje'
import type { Sesion } from '../api/sesiones'
import type { Recurso, AprendizajeConRecurso } from '../api/recursos'
import type { QuizResumen } from '../api/quiz'
import type { FlashcardConEstado } from '../api/flashcards'
import type { MapaResumen } from '../api/mapas'
import type { EjercicioResumen } from '../api/ejercicios'
import type { TestEstiloResumen } from '../api/testEstilo'
import type { Diario } from '../api/seguimiento'
import type { ActividadEjecucion } from '../api/planesDesarrollo'

function fuentesVacias() {
  return {
    sesiones: [] as Sesion[],
    recursos: [] as Recurso[],
    aprendizajes: [] as AprendizajeConRecurso[],
    quizzes: [] as QuizResumen[],
    flashcards: [] as FlashcardConEstado[],
    mapas: [] as MapaResumen[],
    ejercicios: [] as EjercicioResumen[],
    testEstilo: [] as TestEstiloResumen[],
    diario: [] as Diario[],
    planEstado: null,
    actividades: [] as ActividadEjecucion[],
  }
}

function fechaEnDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString()
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

  it('counts ejercicios with numeroVersiones=0 as sinEntregar', () => {
    const ejercicios = [
      { id: 'e1', numeroVersiones: 0 },
      { id: 'e2', numeroVersiones: 2 },
    ] as EjercicioResumen[]

    const resumen = resumenAprendizaje({ ...fuentesVacias(), ejercicios })

    expect(resumen.ejercicios).toEqual({ total: 2, sinEntregar: 1 })
  })

  it('counts tests de estilo with yaRespondido=false as sinResponder', () => {
    const testEstilo = [
      { id: 't1', yaRespondido: false },
      { id: 't2', yaRespondido: true },
    ] as TestEstiloResumen[]

    const resumen = resumenAprendizaje({ ...fuentesVacias(), testEstilo })

    expect(resumen.testEstilo).toEqual({ total: 2, sinResponder: 1 })
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

  describe('tareasPendientes', () => {
    it('includes every actividad not yet completada, regardless of fecha', () => {
      const actividades = [
        { id: 'a1', actividad: 'Practicar feedback', estado: 'pendiente' },
        { id: 'a2', actividad: 'Leer artículo', estado: 'en_curso' },
        { id: 'a3', actividad: 'Ya hecha', estado: 'completada' },
      ] as ActividadEjecucion[]

      const tareas = resumenAprendizaje({ ...fuentesVacias(), actividades }).tareasPendientes

      expect(tareas.map((t) => t.titulo)).toEqual(['Practicar feedback', 'Leer artículo'])
      expect(tareas.every((t) => t.tipo === 'actividad' && !t.urgente)).toBe(true)
    })

    it('includes a quiz sin responder only when its fechaLimite is vencida or próxima (≤7 días)', () => {
      const quizzes = [
        { id: 'q1', titulo: 'Vence pronto', mejorPuntaje: null, fechaLimite: fechaEnDias(3) },
        { id: 'q2', titulo: 'Vence lejos', mejorPuntaje: null, fechaLimite: fechaEnDias(30) },
        { id: 'q3', titulo: 'Sin fecha', mejorPuntaje: null, fechaLimite: null },
        { id: 'q4', titulo: 'Ya respondido', mejorPuntaje: 5, fechaLimite: fechaEnDias(1) },
      ] as QuizResumen[]

      const tareas = resumenAprendizaje({ ...fuentesVacias(), quizzes }).tareasPendientes

      expect(tareas.map((t) => t.titulo)).toEqual(['Vence pronto'])
      expect(tareas[0].tipo).toBe('quiz')
    })

    it('flags a vencida fechaLimite as "Venció" and marks it urgente', () => {
      const quizzes = [
        { id: 'q1', titulo: 'Atrasado', mejorPuntaje: null, fechaLimite: fechaEnDias(-2) },
      ] as QuizResumen[]

      const tareas = resumenAprendizaje({ ...fuentesVacias(), quizzes }).tareasPendientes

      expect(tareas[0]).toMatchObject({ detalle: 'Venció', urgente: true })
    })

    it('includes ejercicios sin entregar and tests de estilo sin responder with a próxima fechaLimite', () => {
      const ejercicios = [
        { id: 'e1', titulo: 'Conversación difícil', numeroVersiones: 0, fechaLimite: fechaEnDias(2) },
      ] as EjercicioResumen[]
      const testEstilo = [
        { id: 't1', titulo: 'Manejo de conflicto', yaRespondido: false, fechaLimite: fechaEnDias(2) },
      ] as TestEstiloResumen[]

      const tareas = resumenAprendizaje({ ...fuentesVacias(), ejercicios, testEstilo }).tareasPendientes

      expect(tareas.map((t) => t.tipo)).toEqual(['ejercicios', 'test-estilo'])
    })

    it('includes a recurso sin apuntes with a próxima fechaLimite', () => {
      const recursos = [{ id: 'r1', titulo: 'Guía', fechaLimite: fechaEnDias(1) }] as Recurso[]

      const tareas = resumenAprendizaje({ ...fuentesVacias(), recursos }).tareasPendientes

      expect(tareas).toHaveLength(1)
      expect(tareas[0]).toMatchObject({ tipo: 'recurso', titulo: 'Guía' })
    })

    it('does not include flashcards or mapas — no meaningful "completado" state for a deadline task', () => {
      const flashcards = [{ id: 'f1', debeRepasar: true, fechaLimite: fechaEnDias(1) }] as FlashcardConEstado[]
      const mapas = [{ id: 'm1', fechaLimite: fechaEnDias(1) }] as MapaResumen[]

      const tareas = resumenAprendizaje({ ...fuentesVacias(), flashcards, mapas }).tareasPendientes

      expect(tareas).toHaveLength(0)
    })
  })
})
