import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProyeccionIngresosChart from './ProyeccionIngresosChart.vue'
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
  it('renders one bar per month and defaults to the first month in the detail panel', () => {
    const wrapper = mount(ProyeccionIngresosChart, { props: { meses } })

    const barras = wrapper.findAll('button').filter((b) => /'26/.test(b.text()))
    expect(barras).toHaveLength(2)
    expect(wrapper.text()).toContain("Ago '26")
    expect(wrapper.text()).toContain('$500.000')
    expect(wrapper.text()).toContain('Felipe Cortes')
  })

  it('switches the detail panel when a different month is clicked', async () => {
    const wrapper = mount(ProyeccionIngresosChart, { props: { meses } })

    const septiembre = wrapper.findAll('button').find((b) => b.text().includes("Sep '26"))
    await septiembre!.trigger('click')

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
