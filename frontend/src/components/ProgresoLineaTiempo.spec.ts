import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgresoLineaTiempo from './ProgresoLineaTiempo.vue'

describe('ProgresoLineaTiempo', () => {
  it('shows an empty-state message when there are no points', () => {
    const wrapper = mount(ProgresoLineaTiempo, { props: { puntos: [] } })

    expect(wrapper.text()).toContain('Aún no hay datos de progreso')
    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('renders one circle per point and a connecting polyline', () => {
    const wrapper = mount(ProgresoLineaTiempo, {
      props: {
        puntos: [
          { sesionId: 's1', fecha: '2026-01-01T00:00:00.000Z', cercaniaObjetivo: 3 },
          { sesionId: 's2', fecha: '2026-02-01T00:00:00.000Z', cercaniaObjetivo: 7 },
        ],
      },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.findAll('circle')).toHaveLength(2)
    expect(wrapper.find('polyline').attributes('points')?.split(' ')).toHaveLength(2)
  })
})
