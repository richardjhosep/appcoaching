import { ApiError } from '../api/client'

/**
 * Para `promesa.then(v => v ?? null, sin404(null))`: un 404 es un "no hay" legítimo (ej. un
 * coachee sin plan de desarrollo todavía) y se resuelve a `vacio`; cualquier otro error se
 * relanza para que `tolerar()` lo cuente como fallo real y la vista avise "datos incompletos"
 * en vez de mostrar un vacío engañoso ("Todo al día").
 */
export function sin404<T>(vacio: T) {
  return (error: unknown): T => {
    if (error instanceof ApiError && error.status === 404) return vacio
    throw error
  }
}
