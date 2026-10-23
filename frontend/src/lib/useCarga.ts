import { ref } from 'vue'

/**
 * Carga de pantalla con estado de error y reintento. Reemplaza el patrón
 * `onMounted(async () => { await Promise.all(...); loading = false })` que, si una
 * llamada fallaba, dejaba el spinner/skeleton para siempre.
 *
 * - `error`: mensaje cuando falla la carga completa (muestra <ErrorState @retry="recargar">).
 * - `tolerar(p)`: envuelve una llamada NO crítica; si falla devuelve `undefined` y suma a
 *   `fallos`, para avisar "no pudimos cargar X" en vez de mostrar un vacío engañoso.
 */
export function useCarga(cargar: () => Promise<unknown>) {
  const loading = ref(true)
  const error = ref<string | null>(null)
  const fallos = ref(0)

  async function recargar() {
    loading.value = true
    error.value = null
    fallos.value = 0
    try {
      await cargar()
    } catch (e) {
      error.value = e instanceof Error && e.message ? e.message : 'No pudimos cargar la información.'
    } finally {
      loading.value = false
    }
  }

  async function tolerar<T>(p: Promise<T>): Promise<T | undefined> {
    try {
      return await p
    } catch {
      fallos.value += 1
      return undefined
    }
  }

  return { loading, error, fallos, recargar, tolerar }
}
