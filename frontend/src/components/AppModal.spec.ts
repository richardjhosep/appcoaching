import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppModal from './AppModal.vue'

describe('AppModal', () => {
  it('defaults to the original max-w-lg width when no size is given', () => {
    const wrapper = mount(AppModal, { props: { title: 'Título' } })

    const card = document.querySelector('.fixed.inset-0 > div')
    expect(card?.className).toContain('max-w-lg')
    expect(card?.className).not.toContain('max-w-2xl')

    wrapper.unmount()
  })

  it('uses max-w-2xl when size="lg"', () => {
    const wrapper = mount(AppModal, { props: { title: 'Título', size: 'lg' } })

    const card = document.querySelector('.fixed.inset-0 > div')
    expect(card?.className).toContain('max-w-2xl')

    wrapper.unmount()
  })
})
