import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import MisMapasTab from './MisMapasTab.vue'
import type { MapaPersonal, MapaPersonalConNodos } from '../../../api/mapasPersonales'

vi.mock('../../../api/mapasPersonales', () => ({
  listMapasPersonales: vi.fn(),
  createMapaPersonal: vi.fn(),
  getMapaPersonal: vi.fn(),
  deleteMapaPersonal: vi.fn(),
  addNodoPersonal: vi.fn(),
  updateNodoPersonal: vi.fn(),
  deleteNodoPersonal: vi.fn(),
}))
vi.mock('../../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn(),
}))

import {
  listMapasPersonales,
  createMapaPersonal,
  getMapaPersonal,
  deleteMapaPersonal,
  addNodoPersonal,
} from '../../../api/mapasPersonales'
import { confirmDialog } from '../../../lib/notify'

const mapa: MapaPersonal = {
  id: 'mapa-1',
  coacheeId: 'coachee-1',
  titulo: 'Mis metas 2026',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const mapaSinNodos: MapaPersonalConNodos = { ...mapa, nodos: [] }

describe('MisMapasTab', () => {
  beforeEach(() => {
    vi.mocked(listMapasPersonales).mockReset()
    vi.mocked(confirmDialog).mockResolvedValue(true)
  })

  it('shows an empty state when the coachee has no mapas yet', async () => {
    vi.mocked(listMapasPersonales).mockResolvedValue([])

    const wrapper = mount(MisMapasTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no has creado ningún mapa')
  })

  it('creates a new mapa from the modal, with only a título field', async () => {
    vi.mocked(listMapasPersonales).mockResolvedValue([])
    vi.mocked(createMapaPersonal).mockResolvedValue(mapa)
    vi.mocked(getMapaPersonal).mockResolvedValue(mapaSinNodos)

    const wrapper = mount(MisMapasTab)
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === 'Nuevo mapa')
    await nuevoBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="text"]').setValue('Mis metas 2026')
    await modal.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(createMapaPersonal).toHaveBeenCalledWith('Mis metas 2026')
  })

  it('prompts for a tema central when the mapa has no nodos yet', async () => {
    vi.mocked(listMapasPersonales).mockResolvedValue([mapa])
    vi.mocked(getMapaPersonal).mockResolvedValue(mapaSinNodos)
    vi.mocked(addNodoPersonal).mockResolvedValue({
      id: 'raiz',
      mapaId: 'mapa-1',
      parentId: null,
      label: 'Mis metas 2026',
      detalle: null,
      orden: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    const wrapper = mount(MisMapasTab)
    await flushPromises()

    const mapaCard = wrapper.findAll('button').find((b) => b.text().includes('Mis metas 2026'))
    await mapaCard!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Agrega el tema central')

    await wrapper.find('input[type="text"]').setValue('Mis metas 2026')
    const crearBtn = wrapper.findAll('button').find((b) => b.text() === 'Crear tema central')
    await crearBtn!.trigger('click')
    await flushPromises()

    expect(addNodoPersonal).toHaveBeenCalledWith('mapa-1', {
      label: 'Mis metas 2026',
      detalle: undefined,
      parentId: undefined,
    })
  })

  it('deletes a mapa after confirming', async () => {
    vi.mocked(listMapasPersonales).mockResolvedValue([mapa])
    vi.mocked(deleteMapaPersonal).mockResolvedValue({ success: true })

    const wrapper = mount(MisMapasTab)
    await flushPromises()

    const eliminarBtn = wrapper.findAll('button').find((b) => b.text() === 'Eliminar')
    await eliminarBtn!.trigger('click')
    await flushPromises()

    expect(deleteMapaPersonal).toHaveBeenCalledWith('mapa-1')
    expect(wrapper.text()).not.toContain('Mis metas 2026')
  })
})
