import { describe, it, expect } from 'vitest'
import { promedioPorBloque, promedioGeneral } from './retroalimentacionResumen'
import type { RespuestaRetroalimentacion } from '../api/retroalimentacion'

const respuestas: RespuestaRetroalimentacion[] = [
  { bloque: 'Evaluación del Proceso', afirmacion: 'a1', valor: 5 },
  { bloque: 'Evaluación del Proceso', afirmacion: 'a2', valor: 4 },
  { bloque: 'El Coach', afirmacion: 'a3', valor: 5 },
]

describe('promedioPorBloque', () => {
  it('returns one entry per bloque, in first-seen order, with a rounded average', () => {
    const resultado = promedioPorBloque(respuestas)

    expect(resultado).toEqual([
      { bloque: 'Evaluación del Proceso', promedio: 4.5 },
      { bloque: 'El Coach', promedio: 5 },
    ])
  })

  it('returns an empty array for no answers', () => {
    expect(promedioPorBloque([])).toEqual([])
  })
})

describe('promedioGeneral', () => {
  it('averages every answer regardless of bloque', () => {
    expect(promedioGeneral(respuestas)).toBeCloseTo(4.7)
  })

  it('returns null for no answers', () => {
    expect(promedioGeneral([])).toBeNull()
  })
})
