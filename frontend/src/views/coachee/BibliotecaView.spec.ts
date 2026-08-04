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

import { listRecursos, getMisRecursos, getMisAprendizajes } from '../../api/recursos'

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
    vi.mocked(getMisAprendizajes).mockResolvedValue([])
  })

  it('shows only the assigned resource\'s topic under "Mi biblioteca", and its title once opened', async () => {
    const wrapper = mount(BibliotecaView)
    await flushPromises()

    // Asignado has no etiquetas, so it falls into the "Sin categoría" topic card.
    expect(wrapper.text()).toContain('Sin categoría')
    expect(wrapper.text()).not.toContain('liderazgo')

    const topicoCard = wrapper.findAll('button').find((b) => b.text().includes('Sin categoría'))
    await topicoCard!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Recurso asignado')
    expect(wrapper.text()).not.toContain('Recurso del catálogo')
  })

  it('shows the full catalog with correct membership state when opening a resource', async () => {
    const wrapper = mount(BibliotecaView)
    await flushPromises()

    const catalogoTab = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Catálogo general')
    await catalogoTab!.trigger('click')
    await flushPromises()

    const topicoLiderazgo = wrapper.findAll('button').find((b) => b.text().includes('liderazgo'))
    await topicoLiderazgo!.trigger('click')
    await flushPromises()
    const itemNoAsignado = wrapper.findAll('button').find((b) => b.text().includes('Recurso del catálogo'))
    await itemNoAsignado!.trigger('click')
    await flushPromises()
    // AppModal renders via <Teleport to="body">, so its content lands outside
    // the mounted wrapper's own subtree — assert against document.body instead.
    expect(document.body.textContent).toContain('Agregar a mi biblioteca')

    await (document.querySelector('[aria-label="Cerrar"]') as HTMLElement).click()
    await flushPromises()
    const volver = wrapper.findAll('button').find((b) => b.text().includes('Volver a tópicos'))
    await volver!.trigger('click')
    await flushPromises()

    const topicoSinCategoria = wrapper.findAll('button').find((b) => b.text().includes('Sin categoría'))
    await topicoSinCategoria!.trigger('click')
    await flushPromises()
    const itemAsignado = wrapper.findAll('button').find((b) => b.text().includes('Recurso asignado'))
    await itemAsignado!.trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Ya en tu biblioteca')
  })
})
