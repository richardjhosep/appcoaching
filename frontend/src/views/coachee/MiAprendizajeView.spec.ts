import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import MiAprendizajeView from './MiAprendizajeView.vue'

vi.mock('../../api/sesiones', async () => {
  const actual = await vi.importActual<typeof import('../../api/sesiones')>('../../api/sesiones')
  return { ...actual, getMisSesiones: vi.fn() }
})
vi.mock('../../api/recursos', async () => {
  const actual = await vi.importActual<typeof import('../../api/recursos')>('../../api/recursos')
  return { ...actual, getMisRecursos: vi.fn(), listMisAprendizajes: vi.fn() }
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
vi.mock('../../api/seguimiento', async () => {
  const actual = await vi.importActual<typeof import('../../api/seguimiento')>('../../api/seguimiento')
  return { ...actual, getMisEntradasDiario: vi.fn() }
})
vi.mock('../../api/planesDesarrollo', async () => {
  const actual = await vi.importActual<typeof import('../../api/planesDesarrollo')>('../../api/planesDesarrollo')
  return { ...actual, getOwnPlan: vi.fn() }
})

import { getMisSesiones } from '../../api/sesiones'
import { getMisRecursos, listMisAprendizajes } from '../../api/recursos'
import { listQuizzesDisponibles } from '../../api/quiz'
import { listFlashcardsDisponibles } from '../../api/flashcards'
import { listMapasDisponibles } from '../../api/mapas'
import { getMisEntradasDiario } from '../../api/seguimiento'
import { getOwnPlan } from '../../api/planesDesarrollo'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/coachee/quiz', name: 'coachee-quiz', component: { template: '<div />' } },
    { path: '/coachee/sesiones', name: 'coachee-sesiones', component: { template: '<div />' } },
    { path: '/coachee/biblioteca', name: 'coachee-biblioteca', component: { template: '<div />' } },
    { path: '/coachee/flashcards', name: 'coachee-flashcards', component: { template: '<div />' } },
    { path: '/coachee/mapas', name: 'coachee-mapas', component: { template: '<div />' } },
    { path: '/coachee/plan', name: 'coachee-plan', component: { template: '<div />' } },
  ],
})

function mockEmptySources() {
  vi.mocked(getMisSesiones).mockResolvedValue([])
  vi.mocked(getMisRecursos).mockResolvedValue([])
  vi.mocked(listMisAprendizajes).mockResolvedValue([])
  vi.mocked(listQuizzesDisponibles).mockResolvedValue([])
  vi.mocked(listFlashcardsDisponibles).mockResolvedValue([])
  vi.mocked(listMapasDisponibles).mockResolvedValue([])
  vi.mocked(getMisEntradasDiario).mockResolvedValue([])
  vi.mocked(getOwnPlan).mockResolvedValue({ estado: 'aprobado' } as never)
}

describe('MiAprendizajeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows an empty state when every source is empty', async () => {
    mockEmptySources()

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no hay nada que mostrar acá')
  })

  it('shows pending counts across sections when there is data', async () => {
    mockEmptySources()
    vi.mocked(getMisRecursos).mockResolvedValue([
      { id: 'r1', titulo: 'Guía' } as never,
      { id: 'r2', titulo: 'Guía 2' } as never,
    ])
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([{ id: 'q1', mejorPuntaje: null } as never])
    vi.mocked(listFlashcardsDisponibles).mockResolvedValue([{ id: 'f1', debeRepasar: true } as never])
    vi.mocked(getOwnPlan).mockResolvedValue({ estado: 'sin_enviar' } as never)

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('2 sin apuntes')
    expect(wrapper.text()).toContain('1 sin responder')
    expect(wrapper.text()).toContain('1 para repasar hoy')
    expect(wrapper.text()).toContain('Todavía no has enviado tu plan')
  })

  it('navigates to Quiz when its card link is clicked', async () => {
    mockEmptySources()
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([{ id: 'q1', mejorPuntaje: 2 } as never])
    const push = vi.spyOn(router, 'push')

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    const btn = wrapper.findAll('button').find((b) => b.text() === 'Ir a Quiz →')
    await btn!.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'coachee-quiz' })
  })
})
