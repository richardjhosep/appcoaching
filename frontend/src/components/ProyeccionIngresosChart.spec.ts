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
  {
    // Mes con actividad de un coachee independiente pero ninguna empresa — el caso que
    // confundía: el monto grande y las barras no deben mostrar el total combinado
    // (que incluiría al independiente) cuando la pestaña activa es "Empresa".
    mes: '2027-01',
    etiqueta: "Ene '27",
    total: 35000,
    porEmpresa: [],
    porCoachee: [{ nombre: 'Tomás Reyes', monto: 35000 }],
  },
]

describe('ProyeccionIngresosChart', () => {
  it('passes one bar per month to the chart and defaults to the first month in the detail panel', () => {
    const wrapper = mount(ProyeccionIngresosChart, { props: { meses } })

    const option = wrapper.findComponent(VChart).props('option') as { xAxis: { data: string[] } }
    expect(option.xAxis.data).toEqual(["Ago '26", "Sep '26", "Ene '27"])
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

  it('shows $0 and the empty-state note in "Empresa" for a month with only coachee activity, not the combined total', async () => {
    const wrapper = mount(ProyeccionIngresosChart, { props: { meses } })

    await wrapper.findComponent(VChart).vm.$emit('click', { dataIndex: 2 }) // Ene '27
    expect(wrapper.text()).toContain('$35.000') // pestaña "Coachee" (default): coincide con el total combinado

    const empresaToggle = wrapper.findAll('button').find((b) => b.text() === 'Empresa')
    await empresaToggle!.trigger('click')

    expect(wrapper.text()).not.toContain('$35.000')
    expect(wrapper.text()).toContain('$0')
    expect(wrapper.text()).toContain('Sin actividad de empresas este mes.')
  })

  it('uses the per-vista total (not the combined total) for the bar heights', async () => {
    const wrapper = mount(ProyeccionIngresosChart, { props: { meses } })

    const optionCoachee = wrapper.findComponent(VChart).props('option') as { series: { data: number[] }[] }
    // Vista por defecto "coachee": la barra de Ene '27 debe ser 35000 (su único coachee).
    expect(optionCoachee.series[0].data[2]).toBe(35000)

    const empresaToggle = wrapper.findAll('button').find((b) => b.text() === 'Empresa')
    await empresaToggle!.trigger('click')

    // En vista "empresa" esa misma barra debe caer a 0 — no hay empresas ese mes.
    const optionEmpresa = wrapper.findComponent(VChart).props('option') as { series: { data: number[] }[] }
    expect(optionEmpresa.series[0].data[2]).toBe(0)
  })
})
