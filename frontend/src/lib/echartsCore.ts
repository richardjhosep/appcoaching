// Registro modular de ECharts — se importan solo los módulos que la app realmente usa (no
// `echarts` completo) para no inflar el bundle, mismo cuidado con el tamaño que ya se aplica
// en el resto del proyecto. Cualquier gráfico nuevo que necesite un tipo de serie o componente
// no listado acá debe agregarlo aquí, no importar `echarts/core` de nuevo en el componente.
import { use } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, SVGRenderer])

// Export centralizado de VChart (vue-echarts) — cualquier componente de gráfico importa desde
// acá, nunca directo de 'vue-echarts', para garantizar que el registro de arriba ya corrió.
export { default as VChart } from 'vue-echarts'

// Solo se registró SVGRenderer arriba (no CanvasRenderer) — cada <VChart> debe pasar esto en
// `:init-options` para que ECharts sepa explícitamente qué renderer usar. SVG en vez de canvas
// para que el Informe Ejecutivo se imprima/exporte a PDF nítido (canvas rasteriza).
export const ECHARTS_INIT_OPTIONS = { renderer: 'svg' as const }
