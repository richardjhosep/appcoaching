import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BibliotecaView from './BibliotecaView.vue'
import type { Carpeta } from '../../api/carpetas'
import type { Recurso } from '../../api/recursos'

vi.mock('../../api/carpetas', async () => {
  const actual = await vi.importActual<typeof import('../../api/carpetas')>('../../api/carpetas')
  return {
    ...actual,
    getMisCarpetas: vi.fn(),
  }
})

vi.mock('../../api/recursos', async () => {
  const actual = await vi.importActual<typeof import('../../api/recursos')>('../../api/recursos')
  return {
    ...actual,
    getMisRecursos: vi.fn(),
    addAprendizaje: vi.fn(),
    getMisAprendizajes: vi.fn(),
    descargarArchivo: vi.fn(),
  }
})

import { getMisCarpetas } from '../../api/carpetas'
import { getMisRecursos, getMisAprendizajes } from '../../api/recursos'

const raiz: Carpeta = {
  id: 'cp1',
  nombre: 'Liderazgo',
  parentId: null,
  publica: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const sub: Carpeta = {
  id: 'cp2',
  nombre: 'Lecturas',
  parentId: 'cp1',
  publica: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const recursoEnRaiz: Recurso = {
  id: 'r1',
  titulo: 'Recurso en la raíz',
  descripcion: null,
  carpetaId: 'cp1',
  tipo: 'link',
  url: 'https://example.com',
  archivoNombre: null,
  archivoPath: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const recursoEnSub: Recurso = {
  id: 'r2',
  titulo: 'Recurso en subcarpeta',
  descripcion: null,
  carpetaId: 'cp2',
  tipo: 'link',
  url: 'https://example.com/2',
  archivoNombre: null,
  archivoPath: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('BibliotecaView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMisCarpetas).mockResolvedValue([raiz, sub])
    vi.mocked(getMisRecursos).mockResolvedValue([recursoEnRaiz, recursoEnSub])
    vi.mocked(getMisAprendizajes).mockResolvedValue([])
  })

  it('shows root folders with nested resource counts', async () => {
    const wrapper = mount(BibliotecaView)
    await flushPromises()

    expect(wrapper.text()).toContain('Liderazgo')
    expect(wrapper.text()).toContain('2 recursos')
  })

  it('navigates into a folder and shows only its own resources, plus its subfolders', async () => {
    const wrapper = mount(BibliotecaView)
    await flushPromises()

    const carpetaCard = wrapper.findAll('button').find((b) => b.text().includes('Liderazgo'))
    await carpetaCard!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Recurso en la raíz')
    expect(wrapper.text()).not.toContain('Recurso en subcarpeta')
    expect(wrapper.text()).toContain('Lecturas')
  })

  it('shows a resource shared directly, even when its own folder is not visible', async () => {
    const recursoSuelto: Recurso = {
      id: 'r3',
      titulo: 'Compartido puntualmente',
      descripcion: null,
      carpetaId: 'carpeta-invisible',
      tipo: 'link',
      url: 'https://example.com/3',
      archivoNombre: null,
      archivoPath: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(getMisRecursos).mockResolvedValue([recursoEnRaiz, recursoEnSub, recursoSuelto])

    const wrapper = mount(BibliotecaView)
    await flushPromises()

    expect(wrapper.text()).toContain('Compartidos contigo directamente')
    expect(wrapper.text()).toContain('Compartido puntualmente')
  })

  it('opens a resource and loads its aprendizajes', async () => {
    const wrapper = mount(BibliotecaView)
    await flushPromises()

    const carpetaCard = wrapper.findAll('button').find((b) => b.text().includes('Liderazgo'))
    await carpetaCard!.trigger('click')
    await flushPromises()

    const item = wrapper.findAll('button').find((b) => b.text().includes('Recurso en la raíz'))
    await item!.trigger('click')
    await flushPromises()

    expect(getMisAprendizajes).toHaveBeenCalledWith('r1')
    expect(document.body.textContent).toContain('Mis aprendizajes')
  })
})
