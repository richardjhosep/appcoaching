import { describe, it, expect } from 'vitest'
import { categoriasDe } from './testEstiloPerfil'

describe('categoriasDe', () => {
  it('sorts categories by count descending and shares the same max', () => {
    const filas = categoriasDe({ Competir: 2, Colaborar: 5, Evitar: 1 })

    expect(filas).toEqual([
      { categoria: 'Colaborar', conteo: 5, max: 5 },
      { categoria: 'Competir', conteo: 2, max: 5 },
      { categoria: 'Evitar', conteo: 1, max: 5 },
    ])
  })

  it('returns an empty array for an empty resultado', () => {
    expect(categoriasDe({})).toEqual([])
  })
})
