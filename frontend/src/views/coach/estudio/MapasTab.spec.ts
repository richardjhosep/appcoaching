import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MapasTab from './MapasTab.vue'
import type { Mapa, MapaConNodos } from '../../../api/mapas'
import type { Competencia } from '../../../api/competencias'

vi.mock('../../../api/mapas', async () => {
  const actual = await vi.importActual<typeof import('../../../api/mapas')>('../../../api/mapas')
  return {
    ...actual,
    listMapas: vi.fn(),
    createMapa: vi.fn(),
    getMapa: vi.fn(),
    addNodo: vi.fn(),
  }
})

vi.mock('../../../api/competencias', async () => {
  const actual = await vi.importActual<typeof import('../../../api/competencias')>('../../../api/competencias')
  return {
    ...actual,
    listCompetencias: vi.fn(),
  }
})

import { listMapas, createMapa, getMapa, addNodo } from '../../../api/mapas'
import { listCompetencias } from '../../../api/competencias'

vi.mock('../../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn(),
}))

const competencia: Competencia = { id: 'comp-1', nombre: 'Liderazgo', definicion: 'def', niveles: [] }

const mapa: Mapa = {
  id: 'mapa-1',
  titulo: 'Liderazgo situacional',
  competenciaId: 'comp-1',
  competencia: { id: 'comp-1', nombre: 'Liderazgo' },
  recursoId: null,
  activo: true,
  fechaLimite: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const mapaSinNodos: MapaConNodos = { ...mapa, nodos: [] }

describe('MapasTab (coach)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listMapas).mockReset()
    vi.mocked(listCompetencias).mockResolvedValue([competencia])
  })

  it('shows an empty state when the coach has no mapas yet', async () => {
    vi.mocked(listMapas).mockResolvedValue([])

    const wrapper = mount(MapasTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no has creado ningún mapa mental')
  })

  it('creates a new mapa from the modal', async () => {
    vi.mocked(listMapas).mockResolvedValue([])
    vi.mocked(createMapa).mockResolvedValue(mapa)
    vi.mocked(getMapa).mockResolvedValue(mapaSinNodos)

    const wrapper = mount(MapasTab)
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === 'Nuevo mapa')
    await nuevoBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="text"]').setValue('Liderazgo situacional')
    await modal.find('select').setValue('comp-1')
    await modal.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(createMapa).toHaveBeenCalledWith({ titulo: 'Liderazgo situacional', competenciaId: 'comp-1' })
  })

  it('prompts for a tema central when the mapa has no nodos yet', async () => {
    vi.mocked(listMapas).mockResolvedValue([mapa])
    vi.mocked(getMapa).mockResolvedValue(mapaSinNodos)
    vi.mocked(addNodo).mockResolvedValue({
      id: 'raiz',
      mapaId: 'mapa-1',
      parentId: null,
      label: 'Liderazgo situacional',
      detalle: null,
      orden: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    const wrapper = mount(MapasTab)
    await flushPromises()

    const mapaCard = wrapper.findAll('button').find((b) => b.text().includes('Liderazgo situacional'))
    await mapaCard!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Agrega el tema central')

    await wrapper.find('input[type="text"]').setValue('Liderazgo situacional')
    const crearBtn = wrapper.findAll('button').find((b) => b.text() === 'Crear tema central')
    await crearBtn!.trigger('click')
    await flushPromises()

    expect(addNodo).toHaveBeenCalledWith('mapa-1', {
      label: 'Liderazgo situacional',
      detalle: undefined,
      parentId: undefined,
    })
  })
})
