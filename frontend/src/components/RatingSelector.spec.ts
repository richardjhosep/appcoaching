import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RatingSelector from './RatingSelector.vue'

describe('RatingSelector', () => {
  it('renders one pressable button per value with aria-pressed', () => {
    const wrapper = mount(RatingSelector, { props: { modelValue: 3, max: 5, label: 'Utilidad' } })
    const botones = wrapper.findAll('button')

    expect(botones).toHaveLength(5)
    expect(botones[2].attributes('aria-pressed')).toBe('true')
    expect(botones[0].attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('[role="group"]').attributes('aria-label')).toBe('Utilidad')
  })

  it('emits the chosen value and clears it when pressed again', async () => {
    const wrapper = mount(RatingSelector, { props: { modelValue: null, max: 10, label: 'x' } })
    // Se muestra de mayor a menor: la posición 3 de 10 es el valor 7.
    await wrapper.findAll('button')[3].trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([7])

    await wrapper.setProps({ modelValue: 7 })
    await wrapper.findAll('button')[3].trigger('click')
    expect(wrapper.emitted('update:modelValue')![1]).toEqual([null])
  })

  it('shows values from highest to lowest with their legends', () => {
    const wrapper = mount(RatingSelector, {
      props: { modelValue: null, max: 5, label: 'x', leyendas: { 5: 'Muy útil', 1: 'Nada útil' } },
    })

    expect(wrapper.findAll('button').map((b) => b.text())).toEqual(['5', '4', '3', '2', '1'])
    expect(wrapper.text()).toContain('= Muy útil')
    expect(wrapper.text()).toContain('= Nada útil')
  })

  it('is at least 44px tall for touch', () => {
    const wrapper = mount(RatingSelector, { props: { modelValue: null, max: 5, label: 'x' } })
    expect(wrapper.find('button').classes()).toContain('h-11')
  })
})
