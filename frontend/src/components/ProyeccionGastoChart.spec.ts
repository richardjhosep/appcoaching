import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProyeccionGastoChart from './ProyeccionGastoChart.vue'
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

  it('switches the detail when a different month is clicked', async () => {
    const wrapper = mount(ProyeccionGastoChart, { props: { meses } })

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(wrapper.text()).toContain('Sin actividad este mes')
    expect(wrapper.text()).not.toContain('Ana')
  })
})
