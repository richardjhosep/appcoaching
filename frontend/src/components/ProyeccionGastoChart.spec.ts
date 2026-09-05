import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProyeccionGastoChart from './ProyeccionGastoChart.vue'
import { VChart } from '../lib/echartsCore'
import type { ProyeccionMesEmpresa } from '../api/negocio'

const meses: ProyeccionMesEmpresa[] = [
  { mes: '2026-08', etiqueta: "Ago '26", total: 30000, porCoachee: [{ nombre: 'Ana', monto: 30000 }] },
  { mes: '2026-09', etiqueta: "Sep '26", total: 0, porCoachee: [] },
]

describe('ProyeccionGastoChart', () => {
  it('shows the first month\'s total and breakdown by default', () => {
    const wrapper = mount(ProyeccionGastoChart, { props: { meses } })

    expect(wrapper.text()).toContain("Ago '26")
    expect(wrapper.text()).toContain('Ana')
  })

  it('passes both months to the chart, in order', () => {
    const wrapper = mount(ProyeccionGastoChart, { props: { meses } })

    const option = wrapper.findComponent(VChart).props('option') as { xAxis: { data: string[] }; series: [{ data: number[] }] }
    expect(option.xAxis.data).toEqual(["Ago '26", "Sep '26"])
    expect(option.series[0].data).toEqual([30000, 0])
  })

  it('switches the detail when a different month is clicked on the chart', async () => {
    const wrapper = mount(ProyeccionGastoChart, { props: { meses } })

    await wrapper.findComponent(VChart).vm.$emit('click', { dataIndex: 1 })

    expect(wrapper.text()).toContain('Sin actividad este mes')
    expect(wrapper.text()).not.toContain('Ana')
  })
})
