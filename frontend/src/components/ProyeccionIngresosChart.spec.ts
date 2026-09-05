import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProyeccionIngresosChart from './ProyeccionIngresosChart.vue'
import { VChart } from '../lib/echartsCore'
import type { ProyeccionMes } from '../api/negocio'

const meses: ProyeccionMes[] = [
  {
    mes: '2026-08',
    etiqueta: "Ago '26",
    total: 500000,
    porEmpresa: [{ nombre: 'Orbiflex', monto: 500000 }],
    porCoachee: [{ nombre: 'Felipe Cortes', monto: 500000 }],
  },
  {
    mes: '2026-09',
    etiqueta: "Sep '26",
    total: 0,
    porEmpresa: [],
    porCoachee: [],
  },
]

describe('ProyeccionIngresosChart', () => {
  it('passes one bar per month to the chart and defaults to the first month in the detail panel', () => {
    const wrapper = mount(ProyeccionIngresosChart, { props: { meses } })

    const option = wrapper.findComponent(VChart).props('option') as { xAxis: { data: string[] } }
    expect(option.xAxis.data).toEqual(["Ago '26", "Sep '26"])
    expect(wrapper.text()).toContain("Ago '26")
    expect(wrapper.text()).toContain('$500.000')
    expect(wrapper.text()).toContain('Felipe Cortes')
  })

  it('switches the detail panel when a different month is clicked on the chart', async () => {
    const wrapper = mount(ProyeccionIngresosChart, { props: { meses } })

    await wrapper.findComponent(VChart).vm.$emit('click', { dataIndex: 1 })

    expect(wrapper.text()).toContain('Sin actividad de coachees este mes.')
  })

  it('switches the breakdown to empresa when the toggle changes', async () => {
    const wrapper = mount(ProyeccionIngresosChart, { props: { meses } })

    const empresaToggle = wrapper.findAll('button').find((b) => b.text() === 'Empresa')
    await empresaToggle!.trigger('click')

    expect(wrapper.text()).toContain('Orbiflex')
    expect(wrapper.text()).not.toContain('Felipe Cortes')
  })
})
