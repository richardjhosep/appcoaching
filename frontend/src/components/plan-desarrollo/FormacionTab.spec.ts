import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import FormacionTab from './FormacionTab.vue'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'

vi.mock('../../api/recursos', async () => {
  const actual = await vi.importActual<typeof import('../../api/recursos')>('../../api/recursos')
  return { ...actual, getMisRecursos: vi.fn() }
})
vi.mock('../../api/quiz', async () => {
  const actual = await vi.importActual<typeof import('../../api/quiz')>('../../api/quiz')
  return { ...actual, listQuizzesDisponibles: vi.fn() }
})
vi.mock('../../api/flashcards', async () => {
  const actual = await vi.importActual<typeof import('../../api/flashcards')>('../../api/flashcards')
  return { ...actual, listFlashcardsDisponibles: vi.fn() }
})
vi.mock('../../api/mapas', async () => {
  const actual = await vi.importActual<typeof import('../../api/mapas')>('../../api/mapas')
  return { ...actual, listMapasDisponibles: vi.fn() }
})
vi.mock('../../api/competencias', async () => {
  const actual = await vi.importActual<typeof import('../../api/competencias')>('../../api/competencias')
  return { ...actual, listCompetencias: vi.fn() }
})
vi.mock('../../api/recursosPersonales', async () => {
  const actual =
    await vi.importActual<typeof import('../../api/recursosPersonales')>('../../api/recursosPersonales')
  return {
    ...actual,
    listarRecursosPersonales: vi.fn(),
    crearRecursoPersonal: vi.fn(),
    eliminarRecursoPersonal: vi.fn(),
  }
})

import { getMisRecursos } from '../../api/recursos'
import { listQuizzesDisponibles } from '../../api/quiz'
import { listFlashcardsDisponibles } from '../../api/flashcards'
import { listMapasDisponibles } from '../../api/mapas'
import { listCompetencias } from '../../api/competencias'
import {
  listarRecursosPersonales,
  crearRecursoPersonal,
  type RecursoPersonal,
} from '../../api/recursosPersonales'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/coachee/biblioteca', name: 'coachee-biblioteca', component: { template: '<div />' } },
    { path: '/coachee/quiz', name: 'coachee-quiz', component: { template: '<div />' } },
    { path: '/coachee/flashcards', name: 'coachee-flashcards', component: { template: '<div />' } },
    { path: '/coachee/mapas', name: 'coachee-mapas', component: { template: '<div />' } },
  ],
})

function basePlan(overrides: Partial<PlanDesarrollo> = {}): PlanDesarrollo {
  return {
    id: 'plan-1',
    coacheeId: 'coachee-1',
    competenciaId: null,
    nivelActual: null,
    nivelObjetivo: null,
    plazo: null,
    descripcionEstadoActual: null,
    objetivoGeneral: null,
    estado: 'sin_enviar',
    enviadoEn: null,
    comentarioCoach: null,
    habitoCuando: null,
    habitoEnVezDe: null,
    habitoVoyA: null,
    habitoObvio: null,
    habitoSencillo: null,
    habitoAtractivo: null,
    habitoSatisfactorio: null,
    formacionLibros: null,
    formacionArticulos: null,
    formacionVideos: null,
    formacionPodcasts: null,
    formacionPracticaGuiada: null,
    objetivos: [],
    actividades: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as PlanDesarrollo
}

function mockEmptySources() {
  vi.mocked(getMisRecursos).mockResolvedValue([])
  vi.mocked(listQuizzesDisponibles).mockResolvedValue([])
  vi.mocked(listFlashcardsDisponibles).mockResolvedValue([])
  vi.mocked(listMapasDisponibles).mockResolvedValue([])
  vi.mocked(listCompetencias).mockResolvedValue([
    { id: 'comp-1', nombre: 'Comunicación', definicion: 'def', niveles: [], empresaId: null },
    { id: 'comp-2', nombre: 'Liderazgo', definicion: 'def', niveles: [], empresaId: null },
  ])
  vi.mocked(listarRecursosPersonales).mockResolvedValue([])
}

describe('FormacionTab', () => {
  beforeEach(() => {
    mockEmptySources()
  })

  it('asks to define a competencia first when the plan has none', async () => {
    const wrapper = mount(FormacionTab, {
      props: { plan: basePlan() },
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Define primero una competencia')
  })

  it('shows an empty state naming the competencia when there is no content anywhere', async () => {
    const wrapper = mount(FormacionTab, {
      props: { plan: basePlan({ competenciaId: 'comp-1' }) },
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no hay material de Comunicación')
    expect(wrapper.text()).not.toContain('de otras competencias')
  })

  it('clarifies when content exists but only for other competencias', async () => {
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([
      { id: 'q1', titulo: 'Quiz de Liderazgo', competenciaId: 'comp-2' } as never,
    ])

    const wrapper = mount(FormacionTab, {
      props: { plan: basePlan({ competenciaId: 'comp-1' }) },
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no hay material de Comunicación')
    expect(wrapper.text()).toContain('de otras competencias')
  })

  it('lists only the content matching the plan competencia', async () => {
    vi.mocked(getMisRecursos).mockResolvedValue([
      { id: 'r1', titulo: 'Guía útil', competenciaId: 'comp-1', tipo: 'link' } as never,
      { id: 'r2', titulo: 'Otra guía', competenciaId: 'comp-2', tipo: 'link' } as never,
    ])
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([
      { id: 'q1', titulo: 'Quiz relevante', competenciaId: 'comp-1' } as never,
    ])

    const wrapper = mount(FormacionTab, {
      props: { plan: basePlan({ competenciaId: 'comp-1' }) },
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Guía útil')
    expect(wrapper.text()).not.toContain('Otra guía')
    expect(wrapper.text()).toContain('Quiz relevante')
  })

  it('shows legacy free-text formación read-only when present', async () => {
    const wrapper = mount(FormacionTab, {
      props: { plan: basePlan({ formacionLibros: 'Crucial Conversations' }) },
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Notas antiguas de formación')
    expect(wrapper.text()).toContain('Crucial Conversations')
    // Las notas antiguas son de solo lectura — no debe haber ningún input editable
    // dentro de ese bloque puntual (el textarea de "Mis materiales" es otra cosa).
    const detalle = wrapper.find('details')
    expect(detalle.find('textarea').exists()).toBe(false)
    expect(detalle.find('input').exists()).toBe(false)
  })

  describe('Mis materiales de formación', () => {
    it('shows even when the plan has no competencia set', async () => {
      const wrapper = mount(FormacionTab, {
        props: { plan: basePlan() },
        global: { plugins: [router] },
      })
      await flushPromises()

      expect(wrapper.text()).toContain('Mis materiales de formación')
      expect(wrapper.text()).toContain('Define primero una competencia')
    })

    it('lists recursos personales already registered', async () => {
      vi.mocked(listarRecursosPersonales).mockResolvedValue([
        {
          id: 'rp-1',
          coacheeId: 'coachee-1',
          categoria: 'libro',
          titulo: 'Crucial Conversations',
          url: null,
          notas: 'Muy útil para feedback difícil',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])

      const wrapper = mount(FormacionTab, {
        props: { plan: basePlan() },
        global: { plugins: [router] },
      })
      await flushPromises()

      expect(wrapper.text()).toContain('Libro')
      expect(wrapper.text()).toContain('Crucial Conversations')
      expect(wrapper.text()).toContain('Muy útil para feedback difícil')
    })

    it('adds a new recurso personal and prepends it to the list', async () => {
      const creado: RecursoPersonal = {
        id: 'rp-2',
        coacheeId: 'coachee-1',
        categoria: 'video',
        titulo: 'Charla TED sobre feedback',
        url: 'https://example.com/charla',
        notas: null,
        createdAt: '2026-01-02T00:00:00.000Z',
      }
      vi.mocked(crearRecursoPersonal).mockResolvedValue(creado)

      const wrapper = mount(FormacionTab, {
        props: { plan: basePlan() },
        global: { plugins: [router] },
      })
      await flushPromises()

      const selects = wrapper.findAll('select')
      const categoriaSelect = selects[selects.length - 1]
      await categoriaSelect.setValue('video')
      await wrapper.find('input[placeholder="Título"]').setValue('Charla TED sobre feedback')
      await wrapper.find('input[placeholder="Link (opcional)"]').setValue('https://example.com/charla')
      const agregarBtn = wrapper.findAll('button').find((b) => b.text() === 'Agregar')
      await agregarBtn!.trigger('click')
      await flushPromises()

      expect(crearRecursoPersonal).toHaveBeenCalledWith({
        categoria: 'video',
        titulo: 'Charla TED sobre feedback',
        url: 'https://example.com/charla',
        notas: undefined,
      })
      expect(wrapper.text()).toContain('Charla TED sobre feedback')
    })
  })
})
