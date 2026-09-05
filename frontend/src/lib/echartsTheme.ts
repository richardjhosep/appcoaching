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
      borderColor: line,
      textStyle: { color: ink },
    },
  }
}
