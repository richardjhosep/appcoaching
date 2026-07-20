function aFechaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function primerDiaDelMes(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function hoy(): string {
  return aFechaLocal(new Date())
}

/**
 * Compares against the viewer's local calendar day, not the raw UTC date
 * embedded in the ISO string — a timestamp like "2026-01-01T00:00:00Z"
 * (medianoche UTC) is still "31 de diciembre" in Chile (UTC-4), so slicing
 * the ISO string directly would misclasify it as the wrong day near
 * midnight UTC.
 */
export function dentroDeRango(fechaISO: string | undefined, desde: string, hasta: string): boolean {
  if (!fechaISO) return true
  const fecha = aFechaLocal(new Date(fechaISO))
  return (!desde || fecha >= desde) && (!hasta || fecha <= hasta)
}
