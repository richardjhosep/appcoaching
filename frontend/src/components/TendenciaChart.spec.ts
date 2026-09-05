import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TendenciaChart from './TendenciaChart.vue'
import { VChart } from '../lib/echartsCore'
import type { PuntoTendencia } from '../api/satisfaccion'

// ECharts necesita un contenedor con tamaño real para renderizar — happy-dom siempre reporta
// 0x0, así que en vez de assertar sobre el SVG que produciría (frágil e imposible de obtener
// acá), se verifica el `option` que este componente arma y le pasa a <VChart>: es la frontera
// real de responsabilidad de este componente — cómo ECharts pinta esa config ya es
// responsabilidad de la librería, no de este test.
const puntos: PuntoTendencia[] = [
  { mes: '2026-06', etiqueta: "Jun '26", satisfaccionPromedio: null, pctLogrado: null, tasaAsistencia: null },
  { mes: '2026-07', etiqueta: "Jul '26", satisfaccionPromedio: 4, pctLogrado: 80, tasaAsistencia: 90 },
  { mes: '2026-08', etiqueta: "Ago '26", satisfaccionPromedio: 4.5, pctLogrado: 100, tasaAsistencia: 95 },
]

function optionesDeLasTarjetas(puntos: PuntoTendencia[]) {
  const wrapper = mount(TendenciaChart, { props: { puntos } })
  return wrapper.findAllComponents(VChart).map((c) => c.props('option') as { xAxis: { data: string[] }; series: [{ data: number[] }] })
}

describe('TendenciaChart', () => {
  it('shows the 3 metric labels', () => {
    const wrapper = mount(TendenciaChart, { props: { puntos } })

    expect(wrapper.text()).toContain('Satisfacción')
    expect(wrapper.text()).toContain('Procesos logrados')
    expect(wrapper.text()).toContain('Asistencia')
  })

  it('filters out months with no data from each metric series, keeping only real months', () => {
    const [satisfaccion, logrados, asistencia] = optionesDeLasTarjetas(puntos)

    // Jun '26 es null en las 3 métricas — no debe aparecer en ninguna serie.
    expect(satisfaccion.xAxis.data).toEqual(["Jul '26", "Ago '26"])
    expect(satisfaccion.series[0].data).toEqual([4, 4.5])
    expect(logrados.xAxis.data).toEqual(["Jul '26", "Ago '26"])
    expect(logrados.series[0].data).toEqual([80, 100])
    expect(asistencia.xAxis.data).toEqual(["Jul '26", "Ago '26"])
    expect(asistencia.series[0].data).toEqual([90, 95])
  })

  it('shows a placeholder instead of an empty chart when a metric has no data at all', () => {
    const soloNulos: PuntoTendencia[] = [
      { mes: '2026-08', etiqueta: "Ago '26", satisfaccionPromedio: null, pctLogrado: null, tasaAsistencia: null },
    ]
    const wrapper = mount(TendenciaChart, { props: { puntos: soloNulos } })

    expect(wrapper.text()).toContain('Sin datos todavía')
    expect(wrapper.findAllComponents(VChart)).toHaveLength(0)
  })

  it('renders a chart per metric that does have data, even if others do not', () => {
    const mixto: PuntoTendencia[] = [
      { mes: '2026-08', etiqueta: "Ago '26", satisfaccionPromedio: 5, pctLogrado: null, tasaAsistencia: null },
    ]
    const wrapper = mount(TendenciaChart, { props: { puntos: mixto } })

    expect(wrapper.findAllComponents(VChart)).toHaveLength(1)
    expect(wrapper.text()).toContain('Sin datos todavía')
  })
})
