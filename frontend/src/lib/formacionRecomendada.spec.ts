import { describe, it, expect } from 'vitest'
import { formacionDe } from './formacionRecomendada'
import type { Recurso } from '../api/recursos'
import type { QuizResumen } from '../api/quiz'
import type { FlashcardConEstado } from '../api/flashcards'
import type { MapaResumen } from '../api/mapas'

function fuentes() {
  return {
    recursos: [
      { id: 'r1', competenciaId: 'comp-1' },
      { id: 'r2', competenciaId: 'comp-2' },
      { id: 'r3', competenciaId: null },
    ] as Recurso[],
    quizzes: [{ id: 'q1', competenciaId: 'comp-1' }, { id: 'q2', competenciaId: 'comp-2' }] as QuizResumen[],
    flashcards: [{ id: 'f1', competenciaId: 'comp-1' }, { id: 'f2', competenciaId: 'comp-2' }] as FlashcardConEstado[],
    mapas: [{ id: 'm1', competenciaId: 'comp-1' }, { id: 'm2', competenciaId: 'comp-2' }] as MapaResumen[],
  }
}

describe('formacionDe', () => {
  it('is completely empty when the plan has no competencia yet', () => {
    const resultado = formacionDe(null, fuentes())

    expect(resultado).toEqual({ recursos: [], quizzes: [], flashcards: [], mapas: [], vacio: true })
  })

  it('filters every source down to the matching competencia only', () => {
    const resultado = formacionDe('comp-1', fuentes())

    expect(resultado.recursos.map((r) => r.id)).toEqual(['r1'])
    expect(resultado.quizzes.map((q) => q.id)).toEqual(['q1'])
    expect(resultado.flashcards.map((f) => f.id)).toEqual(['f1'])
    expect(resultado.mapas.map((m) => m.id)).toEqual(['m1'])
    expect(resultado.vacio).toBe(false)
  })

  it('is vacio when the competencia has a plan but no matching content', () => {
    const resultado = formacionDe('comp-sin-contenido', fuentes())

    expect(resultado.vacio).toBe(true)
  })
})
