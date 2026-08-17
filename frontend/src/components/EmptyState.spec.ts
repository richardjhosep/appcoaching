import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from './EmptyState.vue'

describe('EmptyState', () => {
  it('renders the title and icon', () => {
    const wrapper = mount(EmptyState, {
      props: { icon: 'biblioteca', title: 'Todavía no hay nada acá' },
    })

    expect(wrapper.text()).toContain('Todavía no hay nada acá')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders the description only when provided', async () => {
    const withoutDescription = mount(EmptyState, {
      props: { icon: 'biblioteca', title: 'Vacío' },
    })
    expect(withoutDescription.text()).not.toContain('undefined')

    const withDescription = mount(EmptyState, {
      props: { icon: 'biblioteca', title: 'Vacío', description: 'Explica por qué está vacío' },
    })
    expect(withDescription.text()).toContain('Explica por qué está vacío')
  })

  it('renders the default slot when provided', () => {
    const wrapper = mount(EmptyState, {
      props: { icon: 'biblioteca', title: 'Vacío' },
      slots: { default: '<button>Hacer algo</button>' },
    })

    expect(wrapper.text()).toContain('Hacer algo')
  })
})
