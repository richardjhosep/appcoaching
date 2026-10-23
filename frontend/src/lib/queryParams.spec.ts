import { describe, it, expect } from 'vitest'
import { armarQuery, leerEntero, leerTexto } from './queryParams'

describe('queryParams', () => {
  it('lee texto y enteros con valores por defecto seguros', () => {
    expect(leerTexto({ q: 'ana' }, 'q')).toBe('ana')
    expect(leerTexto({ q: ['a', 'b'] }, 'q')).toBe('a')
    expect(leerTexto({}, 'q')).toBe('')
    expect(leerEntero({ page: '3' }, 'page')).toBe(3)
    expect(leerEntero({ page: 'x' }, 'page')).toBe(1)
    expect(leerEntero({ page: '-2' }, 'page')).toBe(1)
  })

  it('arma la query omitiendo valores por defecto y conservando parámetros ajenos', () => {
    const q = armarQuery({ otro: 'x', q: 'viejo' }, { q: 'ana', page: 1, dir: 'desc' }, { page: 1, dir: 'desc' })
    expect(q).toEqual({ otro: 'x', q: 'ana' })
  })
})
