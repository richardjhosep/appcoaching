import { describe, it, expect } from 'vitest'
import { buildArbol, layoutArbol, aplanar } from './mapaArbol'
import type { NodoMapa } from '../api/mapas'

function nodo(overrides: Partial<NodoMapa>): NodoMapa {
  return {
    id: 'n',
    mapaId: 'mapa-1',
    parentId: null,
    label: 'Nodo',
    detalle: null,
    orden: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildArbol', () => {
  it('builds a tree from a flat list, ordered by orden', () => {
    const nodos: NodoMapa[] = [
      nodo({ id: 'raiz', parentId: null, orden: 1 }),
      nodo({ id: 'b', parentId: 'raiz', orden: 2, label: 'B' }),
      nodo({ id: 'a', parentId: 'raiz', orden: 1, label: 'A' }),
    ]

    const [raiz] = buildArbol(nodos)

    expect(raiz.id).toBe('raiz')
    expect(raiz.hijos.map((h) => h.label)).toEqual(['A', 'B'])
  })

  it('returns multiple roots when there is more than one node without parentId', () => {
    const nodos: NodoMapa[] = [nodo({ id: 'r1' }), nodo({ id: 'r2' })]

    expect(buildArbol(nodos)).toHaveLength(2)
  })
})

describe('layoutArbol', () => {
  it('assigns increasing y to leaves in visiting order, and centers a parent on its children', () => {
    const nodos: NodoMapa[] = [
      nodo({ id: 'raiz' }),
      nodo({ id: 'h1', parentId: 'raiz', orden: 1 }),
      nodo({ id: 'h2', parentId: 'raiz', orden: 2 }),
    ]
    const [raiz] = buildArbol(nodos)

    const posicionado = layoutArbol(raiz, new Set())

    expect(posicionado.x).toBe(0)
    expect(posicionado.hijosPosicionados[0].x).toBe(1)
    expect(posicionado.hijosPosicionados[0].y).toBe(0)
    expect(posicionado.hijosPosicionados[1].y).toBe(1)
    // El padre se centra en el promedio de sus hijos.
    expect(posicionado.y).toBe(0.5)
  })

  it('treats a collapsed node as a leaf, hiding its subtree from the layout', () => {
    const nodos: NodoMapa[] = [
      nodo({ id: 'raiz' }),
      nodo({ id: 'rama', parentId: 'raiz' }),
      nodo({ id: 'nieto', parentId: 'rama' }),
    ]
    const [raiz] = buildArbol(nodos)

    const posicionado = layoutArbol(raiz, new Set(['rama']))

    const rama = posicionado.hijosPosicionados[0]
    expect(rama.hijosPosicionados).toHaveLength(0)
    expect(rama.tieneHijosOcultos).toBe(true)
  })

  it('marks tieneHijosOcultos=false for a leaf that truly has no children', () => {
    const [raiz] = buildArbol([nodo({ id: 'solo' })])

    const posicionado = layoutArbol(raiz, new Set())

    expect(posicionado.tieneHijosOcultos).toBe(false)
  })
})

describe('aplanar', () => {
  it('flattens a positioned tree into a single list including the root', () => {
    const nodos: NodoMapa[] = [nodo({ id: 'raiz' }), nodo({ id: 'h1', parentId: 'raiz' })]
    const [raiz] = buildArbol(nodos)
    const posicionado = layoutArbol(raiz, new Set())

    const lista = aplanar(posicionado)

    expect(lista.map((n) => n.id)).toEqual(['raiz', 'h1'])
  })
})
