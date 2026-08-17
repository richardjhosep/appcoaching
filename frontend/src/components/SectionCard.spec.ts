import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SectionCard from './SectionCard.vue'

describe('SectionCard', () => {
  it('renders the title and icon when provided', () => {
    const wrapper = mount(SectionCard, {
      props: { title: 'Mi sección', icon: 'objetivo' },
      slots: { default: '<p>Contenido</p>' },
    })

    expect(wrapper.text()).toContain('Mi sección')
    expect(wrapper.text()).toContain('Contenido')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders only the slot content when no title is given', () => {
    const wrapper = mount(SectionCard, {
      slots: { default: '<p>Solo contenido</p>' },
    })

    expect(wrapper.find('h2').exists()).toBe(false)
    expect(wrapper.text()).toContain('Solo contenido')
  })
})
