import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DisponibilidadLista from './DisponibilidadLista.vue'

const dias = Array.from({ length: 7 }, (_, i) => new Date(2030, 0, 7 + i))

describe('DisponibilidadLista', () => {
  it('groups free slots by day and hides empty days', () => {
    const slots = [new Date(2030, 0, 8, 10).toISOString(), new Date(2030, 0, 8, 9).toISOString(), new Date(2030, 0, 10, 15).toISOString()]
    const wrapper = mount(DisponibilidadLista, { props: { dias, slots } })

    expect(wrapper.findAll('h3')).toHaveLength(2)
    const botones = wrapper.findAll('button')
    expect(botones).toHaveLength(3)
    // Ordenados dentro del día: 09:00 antes de 10:00.
    expect(botones[0].text()).toContain('09')
  })

  it('emits solicitar with the slot iso', async () => {
    const iso = new Date(2030, 0, 9, 11).toISOString()
    const wrapper = mount(DisponibilidadLista, { props: { dias, slots: [iso] } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('solicitar')![0]).toEqual([iso])
  })

  it('shows an empty message when the week has no slots', () => {
    const wrapper = mount(DisponibilidadLista, { props: { dias, slots: [] } })
    expect(wrapper.text()).toContain('No hay horarios libres')
  })
})
