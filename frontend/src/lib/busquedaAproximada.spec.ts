import { describe, it, expect } from 'vitest'
import { puntajeCoincidencia, buscarAproximado } from './busquedaAproximada'

describe('puntajeCoincidencia', () => {
  it('matches a plain substring, case/accent-insensitive', () => {
    expect(puntajeCoincidencia('reagenda', 'Ana Reagenda')).not.toBeNull()
    expect(puntajeCoincidencia('REAGENDA', 'Ana Reagenda')).not.toBeNull()
    expect(puntajeCoincidencia('anibal', 'Aníbal Rojas')).not.toBeNull()
  })

  it('ranks a match at the start of the name better than one buried inside it', () => {
    const enFelipe = puntajeCoincidencia('ana', 'Ana Reagenda')!
    const enMitad = puntajeCoincidencia('ana', 'Mariana Soto')!
    expect(enFelipe).toBeLessThan(enMitad)
  })

  it('matches out-of-order-typo-tolerant subsequences, not just substrings', () => {
    // "argnd" no aparece como subcadena en "Ana Reagenda", pero sí como subsecuencia.
    expect(puntajeCoincidencia('argnd', 'Ana Reagenda')).not.toBeNull()
  })

  it('tolerates a substitution typo that breaks the subsequence check', () => {
    // "reagenza" tiene una "z" que no existe en "Ana Reagenda" — ni sustring ni
    // subsecuencia lo detectan, pero está a 1 letra de distancia de "reagenda".
    expect(puntajeCoincidencia('reagenza', 'Ana Reagenda')).not.toBeNull()
  })

  it('ranks a substring match better than a typo-tolerant one for the same query', () => {
    const exacto = puntajeCoincidencia('reagenda', 'Ana Reagenda')!
    const conTypo = puntajeCoincidencia('reagenza', 'Ana Reagenda')!
    expect(exacto).toBeLessThan(conTypo)
  })

  it('does not tolerate a typo so large it stops meaning the same word', () => {
    expect(puntajeCoincidencia('xyzxyz', 'Ana Reagenda')).toBeNull()
  })

  it('returns null when the query is not even a subsequence', () => {
    expect(puntajeCoincidencia('xyz', 'Ana Reagenda')).toBeNull()
  })

  it('returns null for a blank query', () => {
    expect(puntajeCoincidencia('   ', 'Ana Reagenda')).toBeNull()
  })
})

describe('buscarAproximado', () => {
  const coachees = [
    { id: '1', nombre: 'Ana Reagenda' },
    { id: '2', nombre: 'Felipe Cortes' },
    { id: '3', nombre: 'QA Stepper' },
  ]

  it('filters and ranks best matches first', () => {
    const resultado = buscarAproximado('ana', coachees, (c) => c.nombre)
    expect(resultado.map((c) => c.id)).toEqual(['1'])
  })

  it('returns an empty list for a blank query, instead of the whole dataset', () => {
    expect(buscarAproximado('', coachees, (c) => c.nombre)).toEqual([])
    expect(buscarAproximado('   ', coachees, (c) => c.nombre)).toEqual([])
  })

  it('returns an empty list when nothing matches', () => {
    expect(buscarAproximado('zzz', coachees, (c) => c.nombre)).toEqual([])
  })
})
