/** Iniciales para el avatar circular — primera letra del nombre + primera del apellido,
 * en mayúscula. Con un solo nombre, sólo esa letra. Reutilizado en cualquier lugar que
 * muestre un avatar (Dashboard, buscador, ficha de coachee) para que se vean iguales. */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  const primera = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primera + ultima).toUpperCase()
}
