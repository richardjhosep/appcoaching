import type { Carpeta } from '../api/carpetas'

export interface CarpetaNode extends Carpeta {
  hijos: CarpetaNode[]
}

export function buildArbol(carpetas: Carpeta[]): CarpetaNode[] {
  const nodos = new Map<string, CarpetaNode>(carpetas.map((c) => [c.id, { ...c, hijos: [] }]))
  const raiz: CarpetaNode[] = []
  for (const c of carpetas) {
    const nodo = nodos.get(c.id)!
    const padre = c.parentId ? nodos.get(c.parentId) : undefined
    if (padre) padre.hijos.push(nodo)
    else raiz.push(nodo)
  }
  const ordenar = (lista: CarpetaNode[]) => {
    lista.sort((a, b) => a.nombre.localeCompare(b.nombre))
    lista.forEach((n) => ordenar(n.hijos))
  }
  ordenar(raiz)
  return raiz
}

export function breadcrumbDe(carpetas: Carpeta[], carpetaId: string | null): Carpeta[] {
  const porId = new Map(carpetas.map((c) => [c.id, c]))
  const trail: Carpeta[] = []
  let actual = carpetaId ? porId.get(carpetaId) : undefined
  while (actual) {
    trail.unshift(actual)
    actual = actual.parentId ? porId.get(actual.parentId) : undefined
  }
  return trail
}

/** Ids de la carpeta y de todos sus ancestros, para poder auto-expandir el árbol hasta la selección. */
export function idsHastaRaiz(carpetas: Carpeta[], carpetaId: string | null): Set<string> {
  return new Set(breadcrumbDe(carpetas, carpetaId).map((c) => c.id))
}

/** Ids de la carpeta y de todos sus descendientes, para contar recursos anidados. */
export function idsDescendientes(carpetas: Carpeta[], carpetaId: string): Set<string> {
  const hijosPorPadre = new Map<string, string[]>()
  for (const c of carpetas) {
    if (!c.parentId) continue
    if (!hijosPorPadre.has(c.parentId)) hijosPorPadre.set(c.parentId, [])
    hijosPorPadre.get(c.parentId)!.push(c.id)
  }
  const ids = new Set<string>([carpetaId])
  const pila = [carpetaId]
  while (pila.length) {
    const actual = pila.pop()!
    for (const hijoId of hijosPorPadre.get(actual) ?? []) {
      if (!ids.has(hijoId)) {
        ids.add(hijoId)
        pila.push(hijoId)
      }
    }
  }
  return ids
}
