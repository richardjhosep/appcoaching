import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import EstudioView from './EstudioView.vue'
import QuizTab from './estudio/QuizTab.vue'
import FlashcardsTab from './estudio/FlashcardsTab.vue'
import MapasTab from './estudio/MapasTab.vue'
import EjerciciosTab from './estudio/EjerciciosTab.vue'
import TestEstiloTab from './estudio/TestEstiloTab.vue'

vi.mock('../../api/quiz', async () => {
  const actual = await vi.importActual<typeof import('../../api/quiz')>('../../api/quiz')
  return { ...actual, listQuizzes: vi.fn() }
})
vi.mock('../../api/flashcards', async () => {
  const actual = await vi.importActual<typeof import('../../api/flashcards')>('../../api/flashcards')
  return { ...actual, listFlashcards: vi.fn() }
})
vi.mock('../../api/mapas', async () => {
  const actual = await vi.importActual<typeof import('../../api/mapas')>('../../api/mapas')
  return { ...actual, listMapas: vi.fn() }
})
vi.mock('../../api/ejercicios', async () => {
  const actual = await vi.importActual<typeof import('../../api/ejercicios')>('../../api/ejercicios')
  return { ...actual, listEjercicios: vi.fn() }
})
vi.mock('../../api/testEstilo', async () => {
  const actual = await vi.importActual<typeof import('../../api/testEstilo')>('../../api/testEstilo')
  return { ...actual, listTestsEstilo: vi.fn() }
})

import { listQuizzes } from '../../api/quiz'
import { listFlashcards } from '../../api/flashcards'
import { listMapas } from '../../api/mapas'
import { listEjercicios } from '../../api/ejercicios'
import { listTestsEstilo } from '../../api/testEstilo'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/coach/estudio', component: EstudioView }],
})

const stubs = {
  QuizTab: true,
  FlashcardsTab: true,
  MapasTab: true,
  EjerciciosTab: true,
  TestEstiloTab: true,
}

describe('EstudioView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.mocked(listQuizzes).mockResolvedValue([{ id: 'q1' }, { id: 'q2' }] as never)
    vi.mocked(listFlashcards).mockResolvedValue([{ id: 'f1' }] as never)
    vi.mocked(listMapas).mockResolvedValue([] as never)
    vi.mocked(listEjercicios).mockResolvedValue([{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }] as never)
    vi.mocked(listTestsEstilo).mockResolvedValue([] as never)
    await router.push('/coach/estudio')
    await router.isReady()
  })

  it('defaults to the "Quiz" tab', async () => {
    const wrapper = mount(EstudioView, { global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.findComponent(QuizTab).exists()).toBe(true)
    expect(wrapper.findComponent(FlashcardsTab).exists()).toBe(false)
  })

  it('switches to "Mapas mentales" on click, without a full reload', async () => {
    const wrapper = mount(EstudioView, { global: { plugins: [router], stubs } })
    await flushPromises()

    const mapasBtn = wrapper.findAll('button').find((b) => b.text().includes('Mapas mentales'))
    await mapasBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(MapasTab).exists()).toBe(true)
    expect(wrapper.findComponent(QuizTab).exists()).toBe(false)
    expect(router.currentRoute.value.query.tab).toBe('mapas')
  })

  it('switches to "Ejercicios" on click', async () => {
    const wrapper = mount(EstudioView, { global: { plugins: [router], stubs } })
    await flushPromises()

    const ejerciciosBtn = wrapper.findAll('button').find((b) => b.text().includes('Ejercicios'))
    await ejerciciosBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(EjerciciosTab).exists()).toBe(true)
    expect(router.currentRoute.value.query.tab).toBe('ejercicios')
  })

  it('switches to "Test de Estilo" on click', async () => {
    const wrapper = mount(EstudioView, { global: { plugins: [router], stubs } })
    await flushPromises()

    const testBtn = wrapper.findAll('button').find((b) => b.text().includes('Test de Estilo'))
    await testBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(TestEstiloTab).exists()).toBe(true)
    expect(router.currentRoute.value.query.tab).toBe('test-estilo')
  })

  it('shows a live item count on each card', async () => {
    const wrapper = mount(EstudioView, { global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Quiz (2)')
    expect(wrapper.text()).toContain('Flashcards (1)')
    expect(wrapper.text()).toContain('Mapas mentales (0)')
    expect(wrapper.text()).toContain('Ejercicios (3)')
    expect(wrapper.text()).toContain('Test de Estilo (0)')
  })
})
