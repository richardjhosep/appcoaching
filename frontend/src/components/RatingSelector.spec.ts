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
    await wrapper.findAll('button')[6].trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([7])

    await wrapper.setProps({ modelValue: 7 })
    await wrapper.findAll('button')[6].trigger('click')
    expect(wrapper.emitted('update:modelValue')![1]).toEqual([null])
  })

  it('is at least 44px tall for touch', () => {
    const wrapper = mount(RatingSelector, { props: { modelValue: null, max: 5, label: 'x' } })
    expect(wrapper.find('button').classes()).toContain('h-11')
  })
})
