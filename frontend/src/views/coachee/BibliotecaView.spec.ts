import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
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
import { getMisRecursos, getMisAprendizajes, addAprendizaje } from '../../api/recursos'

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
  competenciaId: null,
  tipo: 'link',
  categoria: null,
  url: 'https://example.com',
  archivoNombre: null,
  archivoPath: null,
  fechaLimite: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const recursoEnSub: Recurso = {
  id: 'r2',
  titulo: 'Recurso en subcarpeta',
  descripcion: null,
  carpetaId: 'cp2',
  competenciaId: null,
  tipo: 'link',
  categoria: null,
  url: 'https://example.com/2',
  archivoNombre: null,
  archivoPath: null,
  fechaLimite: null,
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
      competenciaId: null,
      tipo: 'link',
      categoria: null,
      url: 'https://example.com/3',
      archivoNombre: null,
      archivoPath: null,
      fechaLimite: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(getMisRecursos).mockResolvedValue([recursoEnRaiz, recursoEnSub, recursoSuelto])

    const wrapper = mount(BibliotecaView)
    await flushPromises()

    expect(wrapper.text()).toContain('Compartidos contigo directamente')
    expect(wrapper.text()).toContain('Compartido puntualmente')
  })

  it('filters resources by categoria, independent of folder navigation', async () => {
    const recursoTexto: Recurso = { ...recursoEnRaiz, id: 'r-texto', titulo: 'PDF de liderazgo', categoria: 'texto' }
    const recursoVideo: Recurso = { ...recursoEnRaiz, id: 'r-video', titulo: 'Charla en video', categoria: 'video' }
    vi.mocked(getMisRecursos).mockResolvedValue([recursoTexto, recursoVideo])

    const wrapper = mount(BibliotecaView)
    await flushPromises()
    const carpetaCard = wrapper.findAll('button').find((b) => b.text().includes('Liderazgo'))
    await carpetaCard!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('PDF de liderazgo')
    expect(wrapper.text()).toContain('Charla en video')

    const filtroVideo = wrapper.findAll('button').find((b) => b.text().trim() === 'Video')
    await filtroVideo!.trigger('click')

    expect(wrapper.text()).not.toContain('PDF de liderazgo')
    expect(wrapper.text()).toContain('Charla en video')
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

  async function abrirLibro() {
    vi.mocked(getMisRecursos).mockResolvedValue([{ ...recursoEnRaiz, categoria: 'texto', titulo: 'Libro de liderazgo' }])
    // El modal se teletransporta a <body>; el test previo que abre un recurso no desmonta, así
    // que se limpia acá para no encontrar inputs de un modal viejo.
    document.body.innerHTML = ''
    const wrapper = mount(BibliotecaView, { attachTo: document.body })
    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text().includes('Liderazgo'))!.trigger('click')
    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text().includes('Libro de liderazgo'))!.trigger('click')
    await flushPromises()
    return { wrapper, modal: new DOMWrapper(document.body) }
  }

  it('requires capítulo (in a book), at least one aprendizaje and the aplicación before saving', async () => {
    vi.mocked(addAprendizaje).mockClear()
    const { wrapper, modal } = await abrirLibro()

    expect(modal.text()).toContain('Capítulo(s) estudiado(s)')
    await modal.findAll('form').at(-1)!.trigger('submit')
    await flushPromises()

    expect(addAprendizaje).not.toHaveBeenCalled()
    expect(modal.text()).toContain('Indica qué capítulo(s) estudiaste.')
    expect(modal.text()).toContain('Registra al menos un aprendizaje.')
    expect(modal.text()).toContain('Este campo es obligatorio')
    wrapper.unmount()
  })

  it('saves several aprendizajes of the same capítulo together with its aplicación', async () => {
    vi.mocked(addAprendizaje).mockClear()
    vi.mocked(addAprendizaje).mockResolvedValue({
      id: 'a1', recursoId: 'r1', coacheeId: 'c1', contenido: 'Escuchar\nPreguntar', aplicacion: 'En mis 1:1', seccion: 'Cap. 3', createdAt: '2026-10-10T00:00:00.000Z',
    })
    const { wrapper, modal } = await abrirLibro()

    await modal.find('input[placeholder="Ej. Capítulos 3 y 4"]').setValue('Cap. 3')
    await modal.find('input[aria-label="Aprendizaje 1"]').setValue('Escuchar')
    await modal.findAll('button').find((b) => b.text() === '+ Otro aprendizaje')!.trigger('click')
    await modal.find('input[aria-label="Aprendizaje 2"]').setValue('Preguntar')
    await modal.find('textarea').setValue('En mis 1:1')
    await modal.findAll('form').at(-1)!.trigger('submit')
    await flushPromises()

    expect(addAprendizaje).toHaveBeenCalledWith('r1', {
      aprendizajes: ['Escuchar', 'Preguntar'],
      aplicacion: 'En mis 1:1',
      seccion: 'Cap. 3',
    })
    // El registro guardado aparece agrupado: capítulo + lista de aprendizajes + aplicación.
    expect(modal.text()).toContain('Cap. 3')
    expect(modal.findAll('li li')).toHaveLength(2)
    wrapper.unmount()
  })
})
