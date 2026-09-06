import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PlaygroundView from './PlaygroundView.vue'
import QuizTab from './playground/QuizTab.vue'
import FlashcardsTab from './playground/FlashcardsTab.vue'
import MapasTab from './playground/MapasTab.vue'
import MisMapasTab from './playground/MisMapasTab.vue'
import EjerciciosTab from './playground/EjerciciosTab.vue'
import TestEstiloTab from './playground/TestEstiloTab.vue'
import PizarraTab from './playground/PizarraTab.vue'

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
vi.mock('../../api/mapasPersonales', () => ({
  listMapasPersonales: vi.fn(),
}))
vi.mock('../../api/ejercicios', async () => {
  const actual = await vi.importActual<typeof import('../../api/ejercicios')>('../../api/ejercicios')
  return { ...actual, listEjerciciosDisponibles: vi.fn() }
})
vi.mock('../../api/testEstilo', async () => {
  const actual = await vi.importActual<typeof import('../../api/testEstilo')>('../../api/testEstilo')
  return { ...actual, listTestsEstiloDisponibles: vi.fn() }
})
vi.mock('../../api/pizarra', () => ({
  listarNotas: vi.fn(),
}))

import { listQuizzesDisponibles } from '../../api/quiz'
import { listFlashcardsDisponibles } from '../../api/flashcards'
import { listMapasDisponibles } from '../../api/mapas'
import { listMapasPersonales } from '../../api/mapasPersonales'
import { listEjerciciosDisponibles } from '../../api/ejercicios'
import { listTestsEstiloDisponibles } from '../../api/testEstilo'
import { listarNotas } from '../../api/pizarra'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/coachee/playground', component: PlaygroundView }],
})

const stubs = {
  QuizTab: true,
  FlashcardsTab: true,
  MapasTab: true,
  MisMapasTab: true,
  EjerciciosTab: true,
  TestEstiloTab: true,
  PizarraTab: true,
}

describe('PlaygroundView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([{ id: 'q1' }] as never)
    vi.mocked(listFlashcardsDisponibles).mockResolvedValue([{ id: 'f1' }, { id: 'f2' }] as never)
    vi.mocked(listMapasDisponibles).mockResolvedValue([] as never)
    vi.mocked(listMapasPersonales).mockResolvedValue([{ id: 'mp1' }] as never)
    vi.mocked(listarNotas).mockResolvedValue([] as never)
    vi.mocked(listEjerciciosDisponibles).mockResolvedValue([{ id: 'e1' }] as never)
    vi.mocked(listTestsEstiloDisponibles).mockResolvedValue([] as never)
    await router.push('/coachee/playground')
    await router.isReady()
  })

  it('defaults to the "Quiz" tab', async () => {
    const wrapper = mount(PlaygroundView, { global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.findComponent(QuizTab).exists()).toBe(true)
    expect(wrapper.findComponent(FlashcardsTab).exists()).toBe(false)
  })

  it('switches to "Test de Estilo" on click, without a full reload', async () => {
    const wrapper = mount(PlaygroundView, { global: { plugins: [router], stubs } })
    await flushPromises()

    const testBtn = wrapper.findAll('button').find((b) => b.text().includes('Test de Estilo'))
    await testBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(TestEstiloTab).exists()).toBe(true)
    expect(wrapper.findComponent(QuizTab).exists()).toBe(false)
    expect(router.currentRoute.value.query.tab).toBe('test-estilo')
  })

  it('switches to "Ejercicios" on click', async () => {
    const wrapper = mount(PlaygroundView, { global: { plugins: [router], stubs } })
    await flushPromises()

    const ejerciciosBtn = wrapper.findAll('button').find((b) => b.text().includes('Ejercicios'))
    await ejerciciosBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(EjerciciosTab).exists()).toBe(true)
    expect(router.currentRoute.value.query.tab).toBe('ejercicios')
  })

  it('switches to "Mapas mentales" on click', async () => {
    const wrapper = mount(PlaygroundView, { global: { plugins: [router], stubs } })
    await flushPromises()

    const mapasBtn = wrapper.findAll('button').find((b) => b.text().includes('Mapas mentales'))
    await mapasBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(MapasTab).exists()).toBe(true)
    expect(router.currentRoute.value.query.tab).toBe('mapas')
  })

  it('switches to "Mis mapas" on click', async () => {
    const wrapper = mount(PlaygroundView, { global: { plugins: [router], stubs } })
    await flushPromises()

    const misMapasBtn = wrapper.findAll('button').find((b) => b.text().includes('Mis mapas'))
    await misMapasBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(MisMapasTab).exists()).toBe(true)
    expect(router.currentRoute.value.query.tab).toBe('mis-mapas')
  })

  it('switches to "Mi pizarra" on click', async () => {
    const wrapper = mount(PlaygroundView, { global: { plugins: [router], stubs } })
    await flushPromises()

    const pizarraBtn = wrapper.findAll('button').find((b) => b.text().includes('Mi pizarra'))
    await pizarraBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(PizarraTab).exists()).toBe(true)
    expect(router.currentRoute.value.query.tab).toBe('pizarra')
  })

  it('shows a live item count on each card', async () => {
    const wrapper = mount(PlaygroundView, { global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Quiz (1)')
    expect(wrapper.text()).toContain('Flashcards (2)')
    expect(wrapper.text()).toContain('Mapas mentales (0)')
    expect(wrapper.text()).toContain('Mis mapas (1)')
    expect(wrapper.text()).toContain('Mi pizarra (0)')
    expect(wrapper.text()).toContain('Ejercicios (1)')
    expect(wrapper.text()).toContain('Test de Estilo (0)')
  })
})
