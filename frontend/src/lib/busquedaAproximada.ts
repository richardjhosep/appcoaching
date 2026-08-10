function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Distancia de edición (Levenshtein) — cuántas letras hay que cambiar/agregar/quitar
 * para convertir `a` en `b`. Se usa como último recurso para tolerar errores de tipeo
 * por sustitución (ej. "reagenza" vs "reagenda"), que una subsecuencia no detecta. */
function distanciaEdicion(a: string, b: string): number {
  const m = a.length
  const n = b.length
  let previa = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const actual = [i]
    for (let j = 1; j <= n; j++) {
      actual[j] =
        a[i - 1] === b[j - 1]
          ? previa[j - 1]
          : 1 + Math.min(previa[j], actual[j - 1], previa[j - 1])
    }
    previa = actual
  }
  return previa[n]
}

/** Cuántos errores de tipeo tolerar según lo largo de lo escrito — mientras más corto,
 * menos margen (si no, cualquier cosa de 3 letras matchea con todo). */
function toleranciaDeErrores(largo: number): number {
  if (largo <= 4) return 1
  if (largo <= 8) return 2
  return 3
}

/**
 * Puntaje de coincidencia aproximada entre lo que se escribió y un nombre — ignora
 * tildes/mayúsculas, y no exige que sea exacto: cubre subcadena, subsecuencia
 * (saltarse/omitir letras, ej. "argnd" → "Ana Reagenda") y errores de tipeo por
 * sustitución (ej. "reagenza" → "Ana Reagenda"). Menor puntaje = mejor coincidencia;
 * `null` significa que no matchea de ninguna forma.
 */
export function puntajeCoincidencia(query: string, texto: string): number | null {
  const q = normalizar(query)
  const t = normalizar(texto)
  if (!q) return null

  const idx = t.indexOf(q)
  if (idx !== -1) {
    // Coincidencia exacta de subcadena: mejor cuanto más al principio empiece
    // (para que escribir el nombre de pila gane sobre un apellido que lo contenga).
    return idx
  }

  // Subsecuencia: cada letra de `q` debe aparecer en `t` en el mismo orden, no
  // necesariamente seguida — cubre saltarse letras al escribir rápido.
  let qi = 0
  let huecos = 0
  let ultimo = -1
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      huecos += ti - ultimo - 1
      ultimo = ti
      qi++
    }
  }
  if (qi === q.length) return 1000 + huecos

  // Último recurso: errores de tipeo por sustitución — se compara contra cada palabra
  // del nombre (no la frase completa, para que la distancia sea proporcional a una
  // palabra y no se diluya con nombres largos).
  const tolerancia = toleranciaDeErrores(q.length)
  let mejorDistancia = Infinity
  for (const palabra of t.split(/\s+/)) {
    const distancia = distanciaEdicion(q, palabra)
    if (distancia < mejorDistancia) mejorDistancia = distancia
  }
  if (mejorDistancia <= tolerancia) return 2000 + mejorDistancia * 100

  return null
}

/**
 * Filtra y ordena una lista por qué tan bien matchea `query` contra el campo elegido —
 * las mejores coincidencias primero. Lista vacía si `query` está en blanco.
 */
export function buscarAproximado<T>(query: string, items: T[], campo: (item: T) => string): T[] {
  if (!query.trim()) return []
  return items
    .map((item) => ({ item, score: puntajeCoincidencia(query, campo(item)) }))
    .filter((x): x is { item: T; score: number } => x.score !== null)
    .sort((a, b) => a.score - b.score)
    .map((x) => x.item)
}
