import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NotaPizarraCard from './NotaPizarra.vue'
import type { NotaPizarra } from '../api/pizarra'
import { COLORES_NOTA } from '../lib/colorNota'

const nota: NotaPizarra = {
  id: 'n1',
  coacheeId: 'c1',
  texto: 'Recordar practicar respiración',
  color: COLORES_NOTA[0],
  posX: 24,
  posY: 24,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('NotaPizarra', () => {
  it('renders the texto and positions itself with the given posX/posY', () => {
    const wrapper = mount(NotaPizarraCard, { props: { nota } })

    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe(
      'Recordar practicar respiración',
    )
    const style = wrapper.find('div').attributes('style') ?? ''
    expect(style).toContain('left: 24px')
    expect(style).toContain('top: 24px')
  })

  it('emits texto on change', async () => {
    const wrapper = mount(NotaPizarraCard, { props: { nota } })

    await wrapper.find('textarea').setValue('Nuevo texto')

    expect(wrapper.emitted('texto')).toEqual([['n1', 'Nuevo texto']])
  })

  it('emits color when a swatch is clicked', async () => {
    const wrapper = mount(NotaPizarraCard, { props: { nota } })

    const swatches = wrapper.findAll('button').filter((b) => !b.attributes('aria-label'))
    await swatches[1].trigger('click')

    expect(wrapper.emitted('color')).toEqual([['n1', COLORES_NOTA[1]]])
  })

  it('emits eliminar when the close button is clicked', async () => {
    const wrapper = mount(NotaPizarraCard, { props: { nota } })

    await wrapper.find('button[aria-label="Eliminar nota"]').trigger('click')

    expect(wrapper.emitted('eliminar')).toEqual([['n1']])
  })

  it('emits mover with the final position on pointer up after dragging', async () => {
    const wrapper = mount(NotaPizarraCard, { props: { nota } })
    const handle = wrapper.find('.cursor-grab')

    await handle.trigger('pointerdown', { clientX: 100, clientY: 100 })
    await handle.trigger('pointermove', { clientX: 150, clientY: 130 })
    await handle.trigger('pointerup')

    // offset = (100-24, 100-24) = (76,76); nueva pos = (150-76, 130-76) = (74, 54)
    expect(wrapper.emitted('mover')).toEqual([['n1', 74, 54]])
  })
})
