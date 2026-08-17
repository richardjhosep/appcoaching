import type { NodoMapa } from '../api/mapas'

export interface NodoArbol extends NodoMapa {
  hijos: NodoArbol[]
}

/** Mismo patrón que buildArbol de carpetas (lib/carpetaArbol.ts), adaptado a NodoMapa. */
export function buildArbol(nodos: NodoMapa[]): NodoArbol[] {
  const porId = new Map<string, NodoArbol>(nodos.map((n) => [n.id, { ...n, hijos: [] }]))
  const raiz: NodoArbol[] = []
  for (const n of nodos) {
    const nodo = porId.get(n.id)!
    const padre = n.parentId ? porId.get(n.parentId) : undefined
    if (padre) padre.hijos.push(nodo)
    else raiz.push(nodo)
  }
  const ordenar = (lista: NodoArbol[]) => {
    lista.sort((a, b) => a.orden - b.orden)
    lista.forEach((n) => ordenar(n.hijos))
  }
  ordenar(raiz)
  return raiz
}

export interface NodoPosicionado extends NodoArbol {
  /** Posición en unidades de grilla, no píxeles — la vista decide el espaciado. */
  x: number
  y: number
  hijosPosicionados: NodoPosicionado[]
  /** Tiene hijos reales pero están colapsados (no se dibujan sus ramas). */
  tieneHijosOcultos: boolean
}

/**
 * Layout horizontal simple: profundidad = X, cada hoja visible ocupa el
 * siguiente slot Y disponible (en orden), cada nodo con hijos se centra en
 * el promedio de Y de sus hijos. Un nodo en `colapsados` se trata como hoja
 * para el layout aunque tenga hijos reales.
 */
export function layoutArbol(raiz: NodoArbol, colapsados: Set<string>): NodoPosicionado {
  let siguienteY = 0

  function asignar(nodo: NodoArbol, depth: number): NodoPosicionado {
    const hijosVisibles = colapsados.has(nodo.id) ? [] : nodo.hijos

    if (hijosVisibles.length === 0) {
      const y = siguienteY
      siguienteY += 1
      return { ...nodo, x: depth, y, hijosPosicionados: [], tieneHijosOcultos: nodo.hijos.length > 0 }
    }

    const hijosPosicionados = hijosVisibles.map((h) => asignar(h, depth + 1))
    const y = hijosPosicionados.reduce((suma, h) => suma + h.y, 0) / hijosPosicionados.length
    return { ...nodo, x: depth, y, hijosPosicionados, tieneHijosOcultos: false }
  }

  return asignar(raiz, 0)
}

/** Aplana un árbol posicionado a una lista, útil para dibujar todos los nodos de una pasada. */
export function aplanar(nodo: NodoPosicionado): NodoPosicionado[] {
  return [nodo, ...nodo.hijosPosicionados.flatMap(aplanar)]
}
