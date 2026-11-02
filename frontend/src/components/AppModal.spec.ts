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

describe('AppModal accesibilidad', () => {
  it('expone role=dialog, aria-modal y aria-labelledby apuntando al título', () => {
    const wrapper = mount(AppModal, { props: { title: 'Mi título' } })
    const dialog = document.querySelector('[role="dialog"]')

    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    const labelId = dialog?.getAttribute('aria-labelledby')
    expect(document.getElementById(labelId as string)?.textContent).toContain('Mi título')

    wrapper.unmount()
  })

  it('emite close al presionar Escape', () => {
    const wrapper = mount(AppModal, { props: { title: 'T' } })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('bloquea el scroll del body mientras está abierto y lo restaura al cerrar', () => {
    const wrapper = mount(AppModal, { props: { title: 'T' } })
    expect(document.body.style.overflow).toBe('hidden')

    wrapper.unmount()
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  // Un overlay con scroll y `items-center` deja la parte de arriba de un diálogo alto
  // fuera de alcance (pantallas bajas de notebook): se centra con `my-auto` en el diálogo.
  it('no centra el overlay con items-center, para que un diálogo alto se pueda recorrer desde arriba', () => {
    const wrapper = mount(AppModal, { props: { title: 'T' } })

    const overlay = document.querySelector('.fixed.inset-0')
    expect(overlay?.className).toContain('items-start')
    expect(overlay?.className).not.toContain('items-center')
    expect(document.querySelector('[role="dialog"]')?.className).toContain('my-auto')

    wrapper.unmount()
  })
})
