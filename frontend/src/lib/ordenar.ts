import { ref, type Ref } from 'vue'

export type DireccionOrden = 'asc' | 'desc'

/** Estado de orden por columna para tablas: clic en la misma columna alterna la dirección. */
export function useOrden(claveInicial: string, dirInicial: DireccionOrden = 'asc') {
  const clave = ref(claveInicial)
  const dir: Ref<DireccionOrden> = ref(dirInicial)

  function alternar(nueva: string) {
    if (clave.value === nueva) {
      dir.value = dir.value === 'asc' ? 'desc' : 'asc'
    } else {
      clave.value = nueva
      dir.value = 'asc'
    }
  }

  return { clave, dir, alternar }
}

type Valor = string | number | boolean | null | undefined

/**
 * Copia ordenada por `valor(item)`: texto con colación en español (sin distinguir tildes ni
 * mayúsculas), números por magnitud y vacíos (null/undefined) siempre al final.
 */
export function ordenarPor<T>(items: T[], valor: (item: T) => Valor, dir: DireccionOrden): T[] {
  const signo = dir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    const va = valor(a)
    const vb = valor(b)
    const aVacio = va === null || va === undefined || va === ''
    const bVacio = vb === null || vb === undefined || vb === ''
    if (aVacio || bVacio) return aVacio === bVacio ? 0 : aVacio ? 1 : -1
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * signo
    if (typeof va === 'boolean' && typeof vb === 'boolean') return (Number(va) - Number(vb)) * signo
    return String(va).localeCompare(String(vb), 'es', { sensitivity: 'base', numeric: true }) * signo
  })
}
