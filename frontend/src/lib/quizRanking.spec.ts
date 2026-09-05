import { describe, it, expect } from 'vitest'
import { rankingDeIntentos } from './quizRanking'
import type { Intento } from '../api/quiz'

function intento(overrides: Partial<Intento>): Intento {
  return {
    id: 'i',
    quizId: 'q1',
    coacheeId: 'c1',
    coachee: { id: 'c1', nombre: 'Felipe' },
    respuestas: [],
    puntaje: 0,
    totalPreguntas: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('rankingDeIntentos', () => {
  it('returns one row per coachee, sorted by best score descending', () => {
    const intentos = [
      intento({ coacheeId: 'c1', coachee: { id: 'c1', nombre: 'Felipe' }, puntaje: 3, createdAt: '2026-01-01T00:00:00.000Z' }),
      intento({ coacheeId: 'c2', coachee: { id: 'c2', nombre: 'Ana' }, puntaje: 5, createdAt: '2026-01-02T00:00:00.000Z' }),
    ]

    const ranking = rankingDeIntentos(intentos)

    expect(ranking.map((r) => r.nombre)).toEqual(['Ana', 'Felipe'])
  })

  it('keeps only the best puntaje per coachee across multiple attempts', () => {
    const intentos = [
      intento({ coacheeId: 'c1', puntaje: 2, createdAt: '2026-01-01T00:00:00.000Z' }),
      intento({ coacheeId: 'c1', puntaje: 4, createdAt: '2026-01-03T00:00:00.000Z' }),
      intento({ coacheeId: 'c1', puntaje: 3, createdAt: '2026-01-05T00:00:00.000Z' }),
    ]

    const [resultado] = rankingDeIntentos(intentos)

    expect(resultado.mejorPuntaje).toBe(4)
    expect(resultado.totalIntentos).toBe(3)
    expect(resultado.fechaMejorIntento).toBe('2026-01-03T00:00:00.000Z')
  })

  it('breaks ties by who reached the score first', () => {
    const intentos = [
      intento({ coacheeId: 'c1', coachee: { id: 'c1', nombre: 'Felipe' }, puntaje: 4, createdAt: '2026-01-05T00:00:00.000Z' }),
      intento({ coacheeId: 'c2', coachee: { id: 'c2', nombre: 'Ana' }, puntaje: 4, createdAt: '2026-01-02T00:00:00.000Z' }),
    ]

    const ranking = rankingDeIntentos(intentos)

    expect(ranking.map((r) => r.nombre)).toEqual(['Ana', 'Felipe'])
  })

  it('returns an empty array for no intentos', () => {
    expect(rankingDeIntentos([])).toEqual([])
  })
})
