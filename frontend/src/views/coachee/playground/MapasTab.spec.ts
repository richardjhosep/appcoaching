import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MapasTab from './MapasTab.vue'
import type { MapaConNodos, MapaResumen } from '../../../api/mapas'

vi.mock('../../../api/mapas', async () => {
  const actual = await vi.importActual<typeof import('../../../api/mapas')>('../../../api/mapas')
  return {
    ...actual,
    listMapasDisponibles: vi.fn(),
    getMapa: vi.fn(),
  }
})

import { listMapasDisponibles, getMapa } from '../../../api/mapas'

const resumen: MapaResumen = {
  id: 'mapa-1',
  titulo: 'Liderazgo situacional',
  competenciaId: 'comp-1',
  competencia: { id: 'comp-1', nombre: 'Liderazgo' },
  recursoId: null,
  activo: true,
  fechaLimite: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  totalNodos: 3,
}

const conNodos: MapaConNodos = {
  id: 'mapa-1',
  titulo: 'Liderazgo situacional',
  competenciaId: 'comp-1',
  recursoId: null,
  activo: true,
  fechaLimite: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  nodos: [
    { id: 'raiz', mapaId: 'mapa-1', parentId: null, label: 'Liderazgo situacional', detalle: null, orden: 1, createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'h1', mapaId: 'mapa-1', parentId: 'raiz', label: 'Delegar', detalle: 'Ceder autonomía cuando el equipo está listo.', orden: 1, createdAt: '2026-01-01T00:00:00.000Z' },
  ],
}

describe('MapasTab (coachee)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listMapasDisponibles).mockReset()
  })

  it('shows an empty state when there are no mapas available', async () => {
    vi.mocked(listMapasDisponibles).mockResolvedValue([])

    const wrapper = mount(MapasTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no tienes mapas mentales disponibles')
  })

  it('lists available mapas with their node count', async () => {
    vi.mocked(listMapasDisponibles).mockResolvedValue([resumen])

    const wrapper = mount(MapasTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Liderazgo situacional')
    expect(wrapper.text()).toContain('3 nodos')
  })

  it('opens a mapa and shows the detalle of a selected node', async () => {
    vi.mocked(listMapasDisponibles).mockResolvedValue([resumen])
    vi.mocked(getMapa).mockResolvedValue(conNodos)

    const wrapper = mount(MapasTab)
    await flushPromises()

    const mapaCard = wrapper.findAll('button').find((b) => b.text().includes('Liderazgo situacional'))
    await mapaCard!.trigger('click')
    await flushPromises()

    const nodoH1 = wrapper.findAll('button').find((b) => b.text().includes('Delegar'))
    await nodoH1!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Ceder autonomía cuando el equipo está listo.')
  })
})
