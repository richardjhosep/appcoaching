import { describe, it, expect } from 'vitest'
import { ordenarPor, useOrden } from './ordenar'

describe('ordenarPor', () => {
  it('ordena texto sin distinguir tildes/mayúsculas y manda vacíos al final en ambas direcciones', () => {
    const items = [{ n: 'zeta' }, { n: null }, { n: 'Álamo' }, { n: 'beta' }]
    expect(ordenarPor(items, (i) => i.n, 'asc').map((i) => i.n)).toEqual(['Álamo', 'beta', 'zeta', null])
    expect(ordenarPor(items, (i) => i.n, 'desc').map((i) => i.n)).toEqual(['zeta', 'beta', 'Álamo', null])
  })

  it('ordena números por magnitud y no muta el original', () => {
    const items = [{ v: 10 }, { v: 2 }, { v: 33 }]
    expect(ordenarPor(items, (i) => i.v, 'asc').map((i) => i.v)).toEqual([2, 10, 33])
    expect(items.map((i) => i.v)).toEqual([10, 2, 33])
  })
})

describe('useOrden', () => {
  it('alterna la dirección en la misma columna y reinicia a asc al cambiar de columna', () => {
    const o = useOrden('nombre')
    o.alternar('nombre')
    expect(o.dir.value).toBe('desc')
    o.alternar('creado')
    expect(o.clave.value).toBe('creado')
    expect(o.dir.value).toBe('asc')
  })
})
