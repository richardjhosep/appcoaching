import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PizarraTab from './PizarraTab.vue'
import NotaPizarraCard from '../../../components/NotaPizarra.vue'
import type { NotaPizarra } from '../../../api/pizarra'

vi.mock('../../../api/pizarra', () => ({
  listarNotas: vi.fn(),
  crearNota: vi.fn(),
  actualizarNota: vi.fn(),
  eliminarNota: vi.fn(),
}))
vi.mock('../../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn(),
}))

import { listarNotas, crearNota, actualizarNota, eliminarNota } from '../../../api/pizarra'
import { confirmDialog } from '../../../lib/notify'

const nota: NotaPizarra = {
  id: 'n1',
  coacheeId: 'c1',
  texto: 'Ya escrita',
  color: '#fef3c7',
  posX: 24,
  posY: 24,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('PizarraTab', () => {
  beforeEach(() => {
    vi.mocked(confirmDialog).mockResolvedValue(true)
  })

  it('shows an empty state when there are no notas yet', async () => {
    vi.mocked(listarNotas).mockResolvedValue([])

    const wrapper = mount(PizarraTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Tu pizarra está vacía')
  })

  it('creates a new nota when "+ Nueva nota" is clicked', async () => {
    vi.mocked(listarNotas).mockResolvedValue([])
    vi.mocked(crearNota).mockResolvedValue(nota)

    const wrapper = mount(PizarraTab)
    await flushPromises()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(crearNota).toHaveBeenCalledWith(expect.objectContaining({ posX: expect.any(Number), posY: expect.any(Number) }))
    expect(wrapper.findComponent(NotaPizarraCard).exists()).toBe(true)
  })

  it('deletes a nota after confirming', async () => {
    vi.mocked(listarNotas).mockResolvedValue([nota])
    vi.mocked(eliminarNota).mockResolvedValue({ success: true })

    const wrapper = mount(PizarraTab)
    await flushPromises()

    await wrapper.findComponent(NotaPizarraCard).vm.$emit('eliminar', 'n1')
    await flushPromises()

    expect(eliminarNota).toHaveBeenCalledWith('n1')
    expect(wrapper.findComponent(NotaPizarraCard).exists()).toBe(false)
  })

  it('saves the new position when a nota emits mover', async () => {
    vi.mocked(listarNotas).mockResolvedValue([nota])
    vi.mocked(actualizarNota).mockResolvedValue({ ...nota, posX: 200, posY: 150 })

    const wrapper = mount(PizarraTab)
    await flushPromises()

    await wrapper.findComponent(NotaPizarraCard).vm.$emit('mover', 'n1', 200, 150)
    await flushPromises()

    expect(actualizarNota).toHaveBeenCalledWith('n1', { posX: 200, posY: 150 })
  })
})
