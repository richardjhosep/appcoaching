// ECharts no resuelve `var(--color-sage)` de forma confiable en todos los contextos (algunas
// opciones esperan un color ya resuelto, no una referencia CSS) — este helper lo convierte al
// valor real leyendo `getComputedStyle`, una sola vez por color.
export function resolveColor(cssVar: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
}

// Tipografía, grid y estilo de tooltip compartidos por todos los gráficos — para no repetir
// esta configuración en cada componente nuevo. Cada gráfico hace `{ ...baseOption(), series: […] }`
// y sobreescribe/agrega lo propio (ejes, series).
export function baseOption() {
  const ink = resolveColor('--color-ink')
  const line = resolveColor('--color-line')
  return {
    textStyle: {
      fontFamily: 'inherit',
      fontSize: 12,
      color: ink,
    },
    grid: {
      left: 8,
      right: 8,
      top: 24,
      bottom: 8,
      containLabel: true,
    },
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: '#ffffff',
      borderColor: line,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: ink, fontSize: 12 },
    },
  }
}

// Paleta cíclica de la marca para categorías arbitrarias (departamentos, etc.). Pasadas las 4
// primeras no se repite el mismo color: se reutilizan los mismos tonos más claros (55 % y
// 30 % mezclados con blanco), de modo que 5-12 segmentos nunca coinciden con otro. Aun así la
// leyenda siempre lleva etiqueta + conteo + %, así que el color nunca es el único portador de
// información.
const PALETA_BASE = ['var(--color-sage)', 'var(--color-bronze)', 'var(--color-saltup)', 'var(--color-spark)']
export function colorCategoria(indice: number): string {
  const base = PALETA_BASE[indice % PALETA_BASE.length]
  const vuelta = Math.floor(indice / PALETA_BASE.length)
  if (vuelta === 0) return base
  return `color-mix(in srgb, ${base} ${vuelta === 1 ? 55 : 30}%, white)`
}
