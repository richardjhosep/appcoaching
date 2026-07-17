import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BibliotecaView from './BibliotecaView.vue'
import type { Recurso } from '../../api/recursos'

vi.mock('../../api/recursos', async () => {
  const actual = await vi.importActual<typeof import('../../api/recursos')>('../../api/recursos')
  return {
    ...actual,
    listRecursos: vi.fn(),
    getMisRecursos: vi.fn(),
    autoasignarRecurso: vi.fn(),
    quitarAutoasignacion: vi.fn(),
    addAprendizaje: vi.fn(),
    getMisAprendizajes: vi.fn(),
    descargarArchivo: vi.fn(),
  }
})

import { listRecursos, getMisRecursos } from '../../api/recursos'

const asignado: Recurso = {
  id: 'r1',
  titulo: 'Recurso asignado',
  descripcion: null,
  etiquetas: null,
  tipo: 'link',
  url: 'https://example.com',
  archivoNombre: null,
  archivoPath: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const noAsignado: Recurso = {
  id: 'r2',
  titulo: 'Recurso del catálogo',
  descripcion: null,
  etiquetas: ['liderazgo'],
  tipo: 'link',
  url: 'https://example.com/2',
  archivoNombre: null,
  archivoPath: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('BibliotecaView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listRecursos).mockResolvedValue([asignado, noAsignado])
    vi.mocked(getMisRecursos).mockResolvedValue([asignado])
  })

  it('shows only the assigned resource under "Mi biblioteca"', async () => {
    const wrapper = mount(BibliotecaView)
    await flushPromises()

    expect(wrapper.text()).toContain('Recurso asignado')
    expect(wrapper.text()).not.toContain('Recurso del catálogo')
  })

  it('shows the full catalog with correct membership state when switching tabs', async () => {
    const wrapper = mount(BibliotecaView)
    await flushPromises()

    const catalogoTab = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Catálogo general')
    await catalogoTab!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Ya en tu biblioteca')
    expect(wrapper.text()).toContain('Agregar a mi biblioteca')
  })
})
