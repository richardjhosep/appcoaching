import { nextTick } from 'vue'

/**
 * Tras una validación fallida, lleva el foco al primer campo con aria-invalid="true" de
 * `raiz` (por defecto, el diálogo abierto o el documento). Así el error en línea se anuncia
 * y el usuario no tiene que buscarlo.
 */
export async function enfocarPrimerInvalido(raiz?: ParentNode): Promise<void> {
  await nextTick()
  const base = raiz ?? document.querySelector('[role="dialog"]') ?? document
  base.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
